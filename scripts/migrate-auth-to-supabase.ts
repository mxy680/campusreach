#!/usr/bin/env tsx
/**
 * Auth Migration Script: Neon (Auth.js) → Supabase (Supabase Auth)
 *
 * This script migrates:
 * - Users from Neon's User table to Supabase Auth (auth.users)
 * - Organizations (direct copy)
 * - Events (direct copy)
 * - OrganizationMembers (with userId mapping to new Supabase UUIDs)
 *
 * Usage:
 *   pnpm migrate:auth
 *
 * Environment variables required (set in .env.local):
 *   - NEON_DATABASE_URL: Connection string to Neon database
 *   - SUPABASE_DATABASE_URL: Direct connection string to Supabase (port 5432)
 *   - SUPABASE_URL: Supabase project URL (e.g., https://xxx.supabase.co)
 *   - SUPABASE_SERVICE_ROLE_KEY: Service role key (NOT anon key)
 */

import { config } from 'dotenv';
import { Pool } from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as readline from 'readline';
import * as fs from 'fs';

// Load environment variables
config({ path: '.env.local' });
config();

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message: string) {
  log(`❌ ${message}`, 'red');
}

function success(message: string) {
  log(`✅ ${message}`, 'green');
}

function info(message: string) {
  log(`ℹ️  ${message}`, 'blue');
}

function warn(message: string) {
  log(`⚠️  ${message}`, 'yellow');
}

// Types
interface NeonUser {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  role: string;
  profileComplete: boolean;
  hashedPassword: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserIdMapping {
  oldId: string;
  newId: string;
  email: string;
  name: string | null;
  image: string | null;
}

interface MigrationState {
  phase: 'users' | 'orgs' | 'events' | 'members' | 'volunteers' | 'contacts' | 'signups' | 'groupchats' | 'ratings' | 'timeentries' | 'messages' | 'complete';
  userMapping: Record<string, UserIdMapping>;
  lastProcessedUserIndex: number;
}

const STATE_FILE = 'migration-state.json';

function saveState(state: MigrationState) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function loadState(): MigrationState | null {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

function clearState() {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
}

// Get connection strings from environment
const neonUrl = process.env.NEON_DATABASE_URL;
const supabaseDbUrl = process.env.SUPABASE_DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function validateEnv() {
  const missing: string[] = [];
  if (!neonUrl) missing.push('NEON_DATABASE_URL');
  if (!supabaseDbUrl) missing.push('SUPABASE_DATABASE_URL');
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length > 0) {
    error(`Missing environment variables: ${missing.join(', ')}`);
    info('Add these to your .env.local file');
    process.exit(1);
  }
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Phase 1: Validation
async function validatePreMigration(neonPool: Pool): Promise<{
  userCount: number;
  orgCount: number;
  eventCount: number;
  memberCount: number;
  contactCount: number;
  volunteerCount: number;
  signupCount: number;
  chatCount: number;
  ratingCount: number;
  timeEntryCount: number;
  messageCount: number;
  duplicateEmails: string[];
}> {
  log('\n📋 Phase 1: Pre-migration validation', 'cyan');

  // Check for duplicate emails
  const duplicates = await neonPool.query(`
    SELECT email, COUNT(*) as count
    FROM "User"
    WHERE email IS NOT NULL
    GROUP BY email
    HAVING COUNT(*) > 1
  `);

  const duplicateEmails = duplicates.rows.map((r) => r.email);
  if (duplicateEmails.length > 0) {
    warn(`Found ${duplicateEmails.length} duplicate emails:`);
    duplicateEmails.forEach((email) => warn(`  - ${email}`));
  }

  // Count records
  const [userRes, orgRes, eventRes, memberRes, contactRes, volunteerRes, signupRes, chatRes, ratingRes, timeRes, msgRes] = await Promise.all([
    neonPool.query('SELECT COUNT(*) FROM "User"'),
    neonPool.query('SELECT COUNT(*) FROM "Organization"'),
    neonPool.query('SELECT COUNT(*) FROM "Event"'),
    neonPool.query('SELECT COUNT(*) FROM "OrganizationMember"'),
    neonPool.query('SELECT COUNT(*) FROM "OrganizationContact"'),
    neonPool.query('SELECT COUNT(*) FROM "Volunteer"'),
    neonPool.query('SELECT COUNT(*) FROM "EventSignup"'),
    neonPool.query('SELECT COUNT(*) FROM "GroupChat"'),
    neonPool.query('SELECT COUNT(*) FROM "EventRating"'),
    neonPool.query('SELECT COUNT(*) FROM "TimeEntry"'),
    neonPool.query('SELECT COUNT(*) FROM "ChatMessage"'),
  ]);

  const counts = {
    userCount: parseInt(userRes.rows[0].count),
    orgCount: parseInt(orgRes.rows[0].count),
    eventCount: parseInt(eventRes.rows[0].count),
    memberCount: parseInt(memberRes.rows[0].count),
    contactCount: parseInt(contactRes.rows[0].count),
    volunteerCount: parseInt(volunteerRes.rows[0].count),
    signupCount: parseInt(signupRes.rows[0].count),
    chatCount: parseInt(chatRes.rows[0].count),
    ratingCount: parseInt(ratingRes.rows[0].count),
    timeEntryCount: parseInt(timeRes.rows[0].count),
    messageCount: parseInt(msgRes.rows[0].count),
    duplicateEmails,
  };

  info(`Records to migrate:`);
  info(`  Users: ${counts.userCount}`);
  info(`  Organizations: ${counts.orgCount}`);
  info(`  Events: ${counts.eventCount}`);
  info(`  OrganizationMembers: ${counts.memberCount}`);
  info(`  OrganizationContacts: ${counts.contactCount}`);
  info(`  Volunteers: ${counts.volunteerCount}`);
  info(`  EventSignups: ${counts.signupCount}`);
  info(`  GroupChats: ${counts.chatCount}`);
  info(`  EventRatings: ${counts.ratingCount}`);
  info(`  TimeEntries: ${counts.timeEntryCount}`);
  info(`  ChatMessages: ${counts.messageCount}`);

  return counts;
}

// Phase 2: Migrate users to Supabase Auth
async function migrateUsers(
  neonPool: Pool,
  supabaseAdmin: SupabaseClient,
  existingState: MigrationState | null
): Promise<Map<string, UserIdMapping>> {
  log('\n👤 Phase 2: Migrating users to Supabase Auth', 'cyan');

  const userMapping = new Map<string, UserIdMapping>();

  // Restore existing mappings if resuming
  if (existingState?.userMapping) {
    Object.entries(existingState.userMapping).forEach(([oldId, mapping]) => {
      userMapping.set(oldId, mapping);
    });
    info(`Restored ${userMapping.size} user mappings from previous run`);
  }

  const startIndex = existingState?.lastProcessedUserIndex ?? 0;

  // Fetch all users from Neon
  const result = await neonPool.query(`
    SELECT id, name, email, "emailVerified", image, role,
           "profileComplete", "hashedPassword", "createdAt", "updatedAt"
    FROM "User"
    WHERE email IS NOT NULL
    ORDER BY "createdAt" ASC
  `);

  const users: NeonUser[] = result.rows;
  info(`Found ${users.length} users to migrate (starting from index ${startIndex})`);

  const failedUsers: { user: NeonUser; error: string }[] = [];

  for (let i = startIndex; i < users.length; i++) {
    const user = users[i];

    // Skip if already mapped
    if (userMapping.has(user.id)) {
      continue;
    }

    try {
      // Try to create the user
      const createOptions: Parameters<typeof supabaseAdmin.auth.admin.createUser>[0] = {
        email: user.email,
        email_confirm: user.emailVerified !== null,
        user_metadata: {
          name: user.name,
          full_name: user.name,
          avatar_url: user.image,
          legacy_id: user.id,
          legacy_role: user.role,
          profile_complete: user.profileComplete,
          migrated_from: 'neon_authjs',
          created_at_original: user.createdAt?.toISOString(),
        },
        app_metadata: {
          provider: 'google',
          providers: ['google'],
        },
      };

      const { data, error: createError } = await supabaseAdmin.auth.admin.createUser(createOptions);

      if (createError) {
        if (createError.message.includes('already been registered') ||
            createError.message.includes('already exists')) {
          // User already exists - try to find and map them
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const existing = listData?.users.find((u) => u.email === user.email);
          if (existing) {
            userMapping.set(user.id, {
              oldId: user.id,
              newId: existing.id,
              email: user.email,
              name: user.name,
              image: user.image,
            });
            log(`  [${i + 1}/${users.length}] ${user.email} - already exists, mapped`, 'dim');
            continue;
          }
        }
        throw createError;
      }

      if (data?.user) {
        userMapping.set(user.id, {
          oldId: user.id,
          newId: data.user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        });
        success(`  [${i + 1}/${users.length}] ${user.email} - created`);
      }

      // Save state periodically
      if (i % 10 === 0) {
        saveState({
          phase: 'users',
          userMapping: Object.fromEntries(userMapping),
          lastProcessedUserIndex: i,
        });
      }

      // Rate limiting
      await sleep(50);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error(`  [${i + 1}/${users.length}] ${user.email} - failed: ${errorMessage}`);
      failedUsers.push({ user, error: errorMessage });
    }
  }

  // Save final user state
  saveState({
    phase: 'users',
    userMapping: Object.fromEntries(userMapping),
    lastProcessedUserIndex: users.length,
  });

  // Report results
  log('\n  User migration summary:', 'cyan');
  success(`  Created/mapped: ${userMapping.size}`);
  if (failedUsers.length > 0) {
    warn(`  Failed: ${failedUsers.length}`);
    failedUsers.forEach((f) => warn(`    - ${f.user.email}: ${f.error}`));
  }

  return userMapping;
}

// Phase 3: Migrate Organizations
async function migrateOrganizations(neonPool: Pool, supabasePool: Pool): Promise<number> {
  log('\n🏢 Phase 3: Migrating organizations', 'cyan');

  // Clear existing data
  await supabasePool.query('TRUNCATE TABLE "Organization" CASCADE');

  const result = await neonPool.query(`
    SELECT id, name, slug, email, industry, "logoUrl", description, mission,
           "contactName", "contactEmail", "contactPhone", categories,
           twitter, instagram, facebook, linkedin, timezone, locale,
           "defaultEventLocationTemplate", "defaultTimeCommitmentHours",
           "defaultVolunteersNeeded", "createdAt", "updatedAt"
    FROM "Organization"
  `);

  let migrated = 0;
  for (const org of result.rows) {
    try {
      await supabasePool.query(
        `
        INSERT INTO "Organization" (
          id, name, slug, email, industry, "logoUrl", description, mission,
          "contactName", "contactEmail", "contactPhone", categories,
          twitter, instagram, facebook, linkedin, timezone, locale,
          "defaultEventLocationTemplate", "defaultTimeCommitmentHours",
          "defaultVolunteersNeeded", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      `,
        [
          org.id,
          org.name,
          org.slug,
          org.email,
          org.industry,
          org.logoUrl,
          org.description,
          org.mission,
          org.contactName,
          org.contactEmail,
          org.contactPhone,
          org.categories,
          org.twitter,
          org.instagram,
          org.facebook,
          org.linkedin,
          org.timezone,
          org.locale,
          org.defaultEventLocationTemplate,
          org.defaultTimeCommitmentHours,
          org.defaultVolunteersNeeded,
          org.createdAt,
          org.updatedAt,
        ]
      );
      migrated++;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      warn(`  Failed to migrate org ${org.id}: ${errorMessage}`);
    }
  }

  success(`  Migrated ${migrated}/${result.rows.length} organizations`);
  return migrated;
}

// Phase 4: Migrate Events
async function migrateEvents(neonPool: Pool, supabasePool: Pool): Promise<number> {
  log('\n📅 Phase 4: Migrating events', 'cyan');

  // Clear existing data
  await supabasePool.query('TRUNCATE TABLE "Event" CASCADE');

  const result = await neonPool.query(`
    SELECT id, "organizationId", title, "shortDescription", "startsAt",
           "endsAt", location, "volunteersNeeded", notes, "timeCommitmentHours",
           attachments, specialties, "createdAt", "updatedAt"
    FROM "Event"
  `);

  let migrated = 0;
  for (const event of result.rows) {
    try {
      await supabasePool.query(
        `
        INSERT INTO "Event" (
          id, "organizationId", title, "shortDescription", "startsAt",
          "endsAt", location, "volunteersNeeded", notes, "timeCommitmentHours",
          attachments, specialties, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `,
        [
          event.id,
          event.organizationId,
          event.title,
          event.shortDescription,
          event.startsAt,
          event.endsAt,
          event.location,
          event.volunteersNeeded,
          event.notes,
          event.timeCommitmentHours,
          event.attachments,
          event.specialties,
          event.createdAt,
          event.updatedAt,
        ]
      );
      migrated++;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      warn(`  Failed to migrate event ${event.id}: ${errorMessage}`);
    }
  }

  success(`  Migrated ${migrated}/${result.rows.length} events`);
  return migrated;
}

// Phase 5: Migrate OrganizationMembers with ID mapping
async function migrateOrganizationMembers(
  neonPool: Pool,
  supabasePool: Pool,
  userMapping: Map<string, UserIdMapping>
): Promise<{ migrated: number; skipped: number }> {
  log('\n👥 Phase 5: Migrating organization members', 'cyan');

  // Clear existing data
  await supabasePool.query('TRUNCATE TABLE "OrganizationMember" CASCADE');

  // Old schema: id, organizationId, userId, createdAt
  // New schema: id, organizationId, userId, email, name, logoUrl, createdAt
  const result = await neonPool.query(`
    SELECT id, "organizationId", "userId", "createdAt"
    FROM "OrganizationMember"
  `);

  let migrated = 0;
  let skipped = 0;

  for (const member of result.rows) {
    const mapping = userMapping.get(member.userId);

    if (!mapping) {
      warn(`  Skipping member ${member.id}: no mapping for userId ${member.userId}`);
      skipped++;
      continue;
    }

    try {
      await supabasePool.query(
        `
        INSERT INTO "OrganizationMember" (
          id, "organizationId", "userId", email, name, "logoUrl", "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
        [
          member.id,
          member.organizationId,
          mapping.newId, // NEW Supabase UUID
          mapping.email, // Populate from User data
          mapping.name, // Populate from User data
          mapping.image, // Populate from User data (avatar)
          member.createdAt,
        ]
      );
      migrated++;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      warn(`  Failed to migrate member ${member.id}: ${errorMessage}`);
      skipped++;
    }
  }

  success(`  Migrated ${migrated} organization members (skipped ${skipped})`);
  return { migrated, skipped };
}

// Phase 6: Migrate Volunteers with ID mapping
async function migrateVolunteers(
  neonPool: Pool,
  supabasePool: Pool,
  userMapping: Map<string, UserIdMapping>
): Promise<{ migrated: number; skipped: number }> {
  log('\n🙋 Phase 6: Migrating volunteers', 'cyan');

  // Clear existing data
  await supabasePool.query('TRUNCATE TABLE "Volunteer" CASCADE');

  // Old schema: id, userId, slug, firstName, lastName, pronouns, school, major,
  //             graduationDate, phone, transportMode, radiusMiles, transportNotes,
  //             weeklyGoalHours, createdAt, updatedAt
  // New schema adds: email, name, image
  const result = await neonPool.query(`
    SELECT id, "userId", slug, "firstName", "lastName", pronouns, school, major,
           "graduationDate", phone, "transportMode", "radiusMiles", "transportNotes",
           "weeklyGoalHours", "createdAt", "updatedAt"
    FROM "Volunteer"
  `);

  let migrated = 0;
  let skipped = 0;

  for (const vol of result.rows) {
    const mapping = userMapping.get(vol.userId);

    if (!mapping) {
      warn(`  Skipping volunteer ${vol.id}: no mapping for userId ${vol.userId}`);
      skipped++;
      continue;
    }

    try {
      await supabasePool.query(
        `
        INSERT INTO "Volunteer" (
          id, "userId", email, slug, "firstName", "lastName", name, image,
          pronouns, school, major, "graduationDate", phone,
          "transportMode", "radiusMiles", "transportNotes",
          "weeklyGoalHours", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `,
        [
          vol.id,
          mapping.newId, // NEW Supabase UUID
          mapping.email, // Populate from User data
          vol.slug,
          vol.firstName,
          vol.lastName,
          mapping.name, // Populate from User data
          mapping.image, // Populate from User data
          vol.pronouns,
          vol.school,
          vol.major,
          vol.graduationDate,
          vol.phone,
          vol.transportMode,
          vol.radiusMiles,
          vol.transportNotes,
          vol.weeklyGoalHours,
          vol.createdAt,
          vol.updatedAt,
        ]
      );
      migrated++;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      warn(`  Failed to migrate volunteer ${vol.id}: ${errorMessage}`);
      skipped++;
    }
  }

  success(`  Migrated ${migrated} volunteers (skipped ${skipped})`);
  return { migrated, skipped };
}

// Phase 7: Migrate OrganizationContacts
async function migrateOrganizationContacts(
  neonPool: Pool,
  supabasePool: Pool
): Promise<number> {
  log('\n📇 Phase 7: Migrating organization contacts', 'cyan');

  await supabasePool.query('TRUNCATE TABLE "OrganizationContact" CASCADE');

  const result = await neonPool.query(`
    SELECT id, "organizationId", name, email, phone, role, "createdAt"
    FROM "OrganizationContact"
  `);

  let migrated = 0;
  for (const contact of result.rows) {
    try {
      await supabasePool.query(
        `
        INSERT INTO "OrganizationContact" (
          id, "organizationId", name, email, phone, role, "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
        [
          contact.id,
          contact.organizationId,
          contact.name,
          contact.email,
          contact.phone,
          contact.role,
          contact.createdAt,
        ]
      );
      migrated++;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      warn(`  Failed to migrate contact ${contact.id}: ${errorMessage}`);
    }
  }

  success(`  Migrated ${migrated}/${result.rows.length} organization contacts`);
  return migrated;
}

// Phase 8: Migrate EventSignups
async function migrateEventSignups(
  neonPool: Pool,
  supabasePool: Pool
): Promise<number> {
  log('\n📝 Phase 8: Migrating event signups', 'cyan');

  await supabasePool.query('TRUNCATE TABLE "EventSignup" CASCADE');

  // Note: old schema doesn't have hoursVerified, it will default to false in new schema
  const result = await neonPool.query(`
    SELECT id, "eventId", "volunteerId", status, "createdAt", "updatedAt"
    FROM "EventSignup"
  `);

  let migrated = 0;
  for (const signup of result.rows) {
    try {
      await supabasePool.query(
        `
        INSERT INTO "EventSignup" (
          id, "eventId", "volunteerId", status, "hoursVerified", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
        [
          signup.id,
          signup.eventId,
          signup.volunteerId,
          signup.status,
          false, // hoursVerified defaults to false
          signup.createdAt,
          signup.updatedAt,
        ]
      );
      migrated++;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      warn(`  Failed to migrate signup ${signup.id}: ${errorMessage}`);
    }
  }

  success(`  Migrated ${migrated}/${result.rows.length} event signups`);
  return migrated;
}

// Phase 9: Migrate GroupChats
async function migrateGroupChats(
  neonPool: Pool,
  supabasePool: Pool
): Promise<number> {
  log('\n💬 Phase 9: Migrating group chats', 'cyan');

  await supabasePool.query('TRUNCATE TABLE "GroupChat" CASCADE');

  const result = await neonPool.query(`
    SELECT id, "eventId", "createdAt"
    FROM "GroupChat"
  `);

  let migrated = 0;
  for (const chat of result.rows) {
    try {
      await supabasePool.query(
        `
        INSERT INTO "GroupChat" (id, "eventId", "createdAt")
        VALUES ($1, $2, $3)
      `,
        [chat.id, chat.eventId, chat.createdAt]
      );
      migrated++;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      warn(`  Failed to migrate group chat ${chat.id}: ${errorMessage}`);
    }
  }

  success(`  Migrated ${migrated}/${result.rows.length} group chats`);
  return migrated;
}

// Phase 10: Migrate EventRatings
async function migrateEventRatings(
  neonPool: Pool,
  supabasePool: Pool
): Promise<number> {
  log('\n⭐ Phase 10: Migrating event ratings', 'cyan');

  await supabasePool.query('TRUNCATE TABLE "EventRating" CASCADE');

  const result = await neonPool.query(`
    SELECT id, "eventId", "volunteerId", rating, comment, "createdAt"
    FROM "EventRating"
  `);

  let migrated = 0;
  for (const rating of result.rows) {
    try {
      await supabasePool.query(
        `
        INSERT INTO "EventRating" (
          id, "eventId", "volunteerId", rating, comment, "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          rating.id,
          rating.eventId,
          rating.volunteerId,
          rating.rating,
          rating.comment,
          rating.createdAt,
        ]
      );
      migrated++;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      warn(`  Failed to migrate rating ${rating.id}: ${errorMessage}`);
    }
  }

  success(`  Migrated ${migrated}/${result.rows.length} event ratings`);
  return migrated;
}

// Phase 11: Migrate TimeEntries
async function migrateTimeEntries(
  neonPool: Pool,
  supabasePool: Pool
): Promise<number> {
  log('\n⏱️  Phase 11: Migrating time entries', 'cyan');

  await supabasePool.query('TRUNCATE TABLE "TimeEntry" CASCADE');

  const result = await neonPool.query(`
    SELECT id, "volunteerId", "eventId", date, hours, notes, "createdAt", "updatedAt"
    FROM "TimeEntry"
  `);

  let migrated = 0;
  for (const entry of result.rows) {
    try {
      await supabasePool.query(
        `
        INSERT INTO "TimeEntry" (
          id, "volunteerId", "eventId", date, hours, notes, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
        [
          entry.id,
          entry.volunteerId,
          entry.eventId,
          entry.date,
          entry.hours,
          entry.notes,
          entry.createdAt,
          entry.updatedAt,
        ]
      );
      migrated++;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      warn(`  Failed to migrate time entry ${entry.id}: ${errorMessage}`);
    }
  }

  success(`  Migrated ${migrated}/${result.rows.length} time entries`);
  return migrated;
}

// Phase 12: Migrate ChatMessages (requires userId mapping)
async function migrateChatMessages(
  neonPool: Pool,
  supabasePool: Pool,
  userMapping: Map<string, UserIdMapping>
): Promise<{ migrated: number; skipped: number }> {
  log('\n💭 Phase 12: Migrating chat messages', 'cyan');

  await supabasePool.query('TRUNCATE TABLE "ChatMessage" CASCADE');

  const result = await neonPool.query(`
    SELECT id, "groupChatId", "eventId", "userId", "authorType", kind, body, "createdAt"
    FROM "ChatMessage"
  `);

  let migrated = 0;
  let skipped = 0;

  for (const msg of result.rows) {
    // Map userId if present
    let newUserId = msg.userId;
    if (msg.userId) {
      const mapping = userMapping.get(msg.userId);
      if (mapping) {
        newUserId = mapping.newId;
      } else {
        warn(`  Skipping message ${msg.id}: no mapping for userId ${msg.userId}`);
        skipped++;
        continue;
      }
    }

    try {
      await supabasePool.query(
        `
        INSERT INTO "ChatMessage" (
          id, "groupChatId", "eventId", "userId", "authorType", kind, body, "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
        [
          msg.id,
          msg.groupChatId,
          msg.eventId,
          newUserId,
          msg.authorType,
          msg.kind,
          msg.body,
          msg.createdAt,
        ]
      );
      migrated++;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      warn(`  Failed to migrate message ${msg.id}: ${errorMessage}`);
      skipped++;
    }
  }

  success(`  Migrated ${migrated} chat messages (skipped ${skipped})`);
  return { migrated, skipped };
}

// Phase 13: Verification
async function verifyMigration(
  supabasePool: Pool,
  supabaseAdmin: SupabaseClient,
  userMapping: Map<string, UserIdMapping>
): Promise<void> {
  log('\n🔍 Phase 13: Verifying migration', 'cyan');

  // Get counts
  const [orgCount, eventCount, memberCount, contactCount, volunteerCount, signupCount, chatCount, ratingCount, timeCount, msgCount] = await Promise.all([
    supabasePool.query('SELECT COUNT(*) FROM "Organization"'),
    supabasePool.query('SELECT COUNT(*) FROM "Event"'),
    supabasePool.query('SELECT COUNT(*) FROM "OrganizationMember"'),
    supabasePool.query('SELECT COUNT(*) FROM "OrganizationContact"'),
    supabasePool.query('SELECT COUNT(*) FROM "Volunteer"'),
    supabasePool.query('SELECT COUNT(*) FROM "EventSignup"'),
    supabasePool.query('SELECT COUNT(*) FROM "GroupChat"'),
    supabasePool.query('SELECT COUNT(*) FROM "EventRating"'),
    supabasePool.query('SELECT COUNT(*) FROM "TimeEntry"'),
    supabasePool.query('SELECT COUNT(*) FROM "ChatMessage"'),
  ]);

  info(`  Supabase counts:`);
  info(`    Organizations: ${orgCount.rows[0].count}`);
  info(`    Events: ${eventCount.rows[0].count}`);
  info(`    OrganizationMembers: ${memberCount.rows[0].count}`);
  info(`    OrganizationContacts: ${contactCount.rows[0].count}`);
  info(`    Volunteers: ${volunteerCount.rows[0].count}`);
  info(`    EventSignups: ${signupCount.rows[0].count}`);
  info(`    GroupChats: ${chatCount.rows[0].count}`);
  info(`    EventRatings: ${ratingCount.rows[0].count}`);
  info(`    TimeEntries: ${timeCount.rows[0].count}`);
  info(`    ChatMessages: ${msgCount.rows[0].count}`);
  info(`    User mappings created: ${userMapping.size}`);

  // Sample verification
  const sampleMappings = Array.from(userMapping.values()).slice(0, 3);
  if (sampleMappings.length > 0) {
    info('\n  Sample user verification:');
    for (const mapping of sampleMappings) {
      try {
        const { data: user, error: err } = await supabaseAdmin.auth.admin.getUserById(mapping.newId);
        if (user?.user) {
          success(`    ${mapping.email}: OK (${mapping.oldId.slice(0, 8)}... → ${mapping.newId.slice(0, 8)}...)`);
        } else {
          error(`    ${mapping.email}: NOT FOUND - ${err?.message}`);
        }
      } catch {
        error(`    ${mapping.email}: ERROR checking user`);
      }
    }
  }
}

// Main
async function main() {
  validateEnv();

  log('\n🚀 Neon Auth.js → Supabase Auth Migration\n', 'cyan');
  log('─'.repeat(50), 'dim');

  // Initialize connections
  const neonPool = new Pool({ connectionString: neonUrl });
  const supabasePool = new Pool({ connectionString: supabaseDbUrl });
  const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Test connections
    info('Testing database connections...');
    await neonPool.query('SELECT 1');
    success('Connected to Neon');
    await supabasePool.query('SELECT 1');
    success('Connected to Supabase DB');

    // Check for existing state
    const existingState = loadState();
    if (existingState) {
      warn(`Found existing migration state (phase: ${existingState.phase})`);
      const resume = await prompt('Resume previous migration? (yes/no): ');
      if (resume !== 'yes') {
        clearState();
        info('Starting fresh migration');
      }
    }

    // Validation
    const counts = await validatePreMigration(neonPool);

    if (counts.duplicateEmails.length > 0) {
      const proceed = await prompt(
        'Duplicate emails found. Continue anyway? (yes/no): '
      );
      if (proceed !== 'yes') {
        log('\nMigration cancelled.', 'yellow');
        process.exit(0);
      }
    }

    // Confirmation
    warn('\n⚠️  This will:');
    warn('  1. Create Supabase Auth users from Neon users');
    warn('  2. TRUNCATE all data tables in Supabase');
    warn('  3. Copy all data from Neon with new user ID mappings');

    const proceed = await prompt('\nProceed with migration? (yes/no): ');
    if (proceed !== 'yes') {
      log('\nMigration cancelled.', 'yellow');
      process.exit(0);
    }

    // Run migration phases
    const userMapping = await migrateUsers(neonPool, supabaseAdmin, existingState);

    saveState({
      phase: 'orgs',
      userMapping: Object.fromEntries(userMapping),
      lastProcessedUserIndex: counts.userCount,
    });

    await migrateOrganizations(neonPool, supabasePool);

    saveState({
      phase: 'events',
      userMapping: Object.fromEntries(userMapping),
      lastProcessedUserIndex: counts.userCount,
    });

    await migrateEvents(neonPool, supabasePool);

    saveState({
      phase: 'members',
      userMapping: Object.fromEntries(userMapping),
      lastProcessedUserIndex: counts.userCount,
    });

    await migrateOrganizationMembers(neonPool, supabasePool, userMapping);

    saveState({
      phase: 'volunteers',
      userMapping: Object.fromEntries(userMapping),
      lastProcessedUserIndex: counts.userCount,
    });

    await migrateVolunteers(neonPool, supabasePool, userMapping);

    saveState({
      phase: 'contacts',
      userMapping: Object.fromEntries(userMapping),
      lastProcessedUserIndex: counts.userCount,
    });

    await migrateOrganizationContacts(neonPool, supabasePool);

    saveState({
      phase: 'signups',
      userMapping: Object.fromEntries(userMapping),
      lastProcessedUserIndex: counts.userCount,
    });

    await migrateEventSignups(neonPool, supabasePool);

    saveState({
      phase: 'groupchats',
      userMapping: Object.fromEntries(userMapping),
      lastProcessedUserIndex: counts.userCount,
    });

    await migrateGroupChats(neonPool, supabasePool);

    saveState({
      phase: 'ratings',
      userMapping: Object.fromEntries(userMapping),
      lastProcessedUserIndex: counts.userCount,
    });

    await migrateEventRatings(neonPool, supabasePool);

    saveState({
      phase: 'timeentries',
      userMapping: Object.fromEntries(userMapping),
      lastProcessedUserIndex: counts.userCount,
    });

    await migrateTimeEntries(neonPool, supabasePool);

    saveState({
      phase: 'messages',
      userMapping: Object.fromEntries(userMapping),
      lastProcessedUserIndex: counts.userCount,
    });

    await migrateChatMessages(neonPool, supabasePool, userMapping);

    // Verification
    await verifyMigration(supabasePool, supabaseAdmin, userMapping);

    // Complete
    saveState({
      phase: 'complete',
      userMapping: Object.fromEntries(userMapping),
      lastProcessedUserIndex: counts.userCount,
    });

    log('\n' + '─'.repeat(50), 'dim');
    log('✨ Migration complete!', 'green');
    log('─'.repeat(50), 'dim');

    info('\nNext steps:');
    info('  1. Verify data in Supabase dashboard');
    info('  2. Run: pnpm db:generate');
    info('  3. Test login with a migrated user');
    info('  4. Delete migration-state.json when satisfied');
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    error(`\nMigration failed: ${errorMessage}`);
    console.error(err);
    info('\nYou can resume this migration by running the script again.');
    process.exit(1);
  } finally {
    await neonPool.end();
    await supabasePool.end();
  }
}

main();
