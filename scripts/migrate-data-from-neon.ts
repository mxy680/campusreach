#!/usr/bin/env tsx
/**
 * Data Migration Script: Neon → Supabase
 * 
 * This script migrates data from a Neon database to Supabase,
 * handling schema differences by transforming the data.
 * 
 * Usage:
 *   tsx scripts/migrate-data-from-neon.ts
 * 
 * Environment variables required (can be set in .env.local or .env):
 *   - NEON_DATABASE_URL: Connection string to Neon database
 *   - SUPABASE_DATABASE_URL: Direct connection string to Supabase (port 5432)
 */

import { config } from 'dotenv';
import { Pool } from 'pg';
import * as readline from 'readline';

// Load .env.local first, then .env (same as prisma.config.ts)
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

// Get connection strings from environment
const neonUrl = process.env.NEON_DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_DATABASE_URL;

if (!neonUrl) {
  error('NEON_DATABASE_URL environment variable is not set');
  process.exit(1);
}

if (!supabaseUrl) {
  error('SUPABASE_DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create database connections
const neonPool = new Pool({ connectionString: neonUrl });
const supabasePool = new Pool({ connectionString: supabaseUrl });

// Table order for migration (respecting foreign key dependencies)
const TABLE_ORDER = [
  'NotificationPreference',
  'Volunteer',
  'Organization',
  'OrganizationMember',
  'OrganizationContact',
  'OrganizationJoinRequest',
  'SignupIntent',
  'Event',
  'EventSignup',
  'EventRating',
  'TimeEntry',
  'GroupChat',
  'ChatMessage',
];

interface TableInfo {
  name: string;
  columns: string[];
  rowCount: number;
}

async function getTableInfo(pool: Pool, tableName: string): Promise<TableInfo | null> {
  try {
    // Check if table exists
    const tableExists = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tableName]
    );

    if (!tableExists.rows[0].exists) {
      return null;
    }

    // Get column names
    const columnsResult = await pool.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = $1 
       ORDER BY ordinal_position`,
      [tableName]
    );

    const columns = columnsResult.rows.map((row) => row.column_name);

    // Get row count
    const countResult = await pool.query(`SELECT COUNT(*) FROM "${tableName}"`);
    const rowCount = parseInt(countResult.rows[0].count, 10);

    return {
      name: tableName,
      columns,
      rowCount,
    };
  } catch (err) {
    error(`Error getting info for table ${tableName}: ${err}`);
    return null;
  }
}

async function compareSchemas() {
  log('\n📊 Comparing schemas between Neon and Supabase...', 'cyan');

  const differences: string[] = [];
  const neonTables: TableInfo[] = [];
  const supabaseTables: TableInfo[] = [];

  for (const tableName of TABLE_ORDER) {
    const neonInfo = await getTableInfo(neonPool, tableName);
    const supabaseInfo = await getTableInfo(supabasePool, tableName);

    if (neonInfo) neonTables.push(neonInfo);
    if (supabaseInfo) supabaseTables.push(supabaseInfo);

    if (neonInfo && !supabaseInfo) {
      differences.push(`Table "${tableName}" exists in Neon but not in Supabase`);
    } else if (!neonInfo && supabaseInfo) {
      differences.push(`Table "${tableName}" exists in Supabase but not in Neon`);
    } else if (neonInfo && supabaseInfo) {
      const neonCols = new Set(neonInfo.columns);
      const supabaseCols = new Set(supabaseInfo.columns);

      const missingInSupabase = neonInfo.columns.filter((col) => !supabaseCols.has(col));
      const missingInNeon = supabaseInfo.columns.filter((col) => !neonCols.has(col));

      if (missingInSupabase.length > 0) {
        differences.push(
          `Table "${tableName}": Columns in Neon but not Supabase: ${missingInSupabase.join(', ')}`
        );
      }
      if (missingInNeon.length > 0) {
        differences.push(
          `Table "${tableName}": Columns in Supabase but not Neon: ${missingInNeon.join(', ')}`
        );
      }

      info(
        `"${tableName}": ${neonInfo.rowCount} rows in Neon, ${supabaseInfo.rowCount} rows in Supabase`
      );
    }
  }

  if (differences.length > 0) {
    warn('\n⚠️  Schema differences detected:');
    differences.forEach((diff) => warn(`  - ${diff}`));
    warn('\nThe migration will attempt to handle these differences.');
  } else {
    success('Schemas match!');
  }

  return { neonTables, supabaseTables, differences };
}

async function migrateTable(
  tableName: string,
  neonInfo: TableInfo,
  supabaseInfo: TableInfo
): Promise<number> {
  info(`Migrating "${tableName}"...`);

  // Get common columns (columns that exist in both schemas)
  const commonColumns = neonInfo.columns.filter((col) =>
    supabaseInfo.columns.includes(col)
  );

  if (commonColumns.length === 0) {
    warn(`  No common columns found for "${tableName}", skipping...`);
    return 0;
  }

  // Build SELECT query for Neon (only common columns)
  const selectColumns = commonColumns.map((col) => `"${col}"`).join(', ');
  const selectQuery = `SELECT ${selectColumns} FROM "${tableName}"`;

  // Fetch data from Neon
  const neonResult = await neonPool.query(selectQuery);
  const rows = neonResult.rows;

  if (rows.length === 0) {
    info(`  No data to migrate for "${tableName}"`);
    return 0;
  }

  // Build INSERT query for Supabase
  const insertColumns = commonColumns.map((col) => `"${col}"`).join(', ');
  const placeholders = commonColumns.map((_, i) => `$${i + 1}`).join(', ');
  const insertQuery = `INSERT INTO "${tableName}" (${insertColumns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

  // Insert data in batches
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    for (const row of batch) {
      try {
        const values = commonColumns.map((col) => row[col]);
        await supabasePool.query(insertQuery, values);
        inserted++;
      } catch (err: any) {
        // Log error but continue
        if (err.code !== '23505') {
          // 23505 is unique constraint violation (expected with ON CONFLICT DO NOTHING)
          warn(`  Error inserting row into "${tableName}": ${err.message}`);
        }
      }
    }
  }

  success(`  Migrated ${inserted}/${rows.length} rows from "${tableName}"`);
  return inserted;
}

async function clearSupabaseData() {
  warn('\n⚠️  This will clear all existing data in Supabase!');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<boolean>((resolve) => {
    rl.question('Do you want to proceed? (yes/no): ', (answer) => {
      rl.close();
      if (answer.toLowerCase() === 'yes') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

async function main() {
  log('\n🚀 Starting data migration from Neon to Supabase\n', 'cyan');

  try {
    // Test connections
    info('Testing database connections...');
    await neonPool.query('SELECT 1');
    success('Connected to Neon');
    await supabasePool.query('SELECT 1');
    success('Connected to Supabase');

    // Compare schemas
    const { neonTables, supabaseTables, differences } = await compareSchemas();

    if (neonTables.length === 0) {
      error('No tables found in Neon database');
      process.exit(1);
    }

    // Ask for confirmation
    const shouldClear = await clearSupabaseData();
    if (!shouldClear) {
      log('\nMigration cancelled.', 'yellow');
      process.exit(0);
    }

    // Clear Supabase data
    log('\n🗑️  Clearing existing data in Supabase...', 'yellow');
    for (const table of TABLE_ORDER.reverse()) {
      // Reverse order to handle foreign keys
      const exists = await supabasePool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );
      if (exists.rows[0].exists) {
        await supabasePool.query(`TRUNCATE TABLE "${table}" CASCADE`);
      }
    }
    success('Supabase data cleared');

    // Migrate data
    log('\n📦 Migrating data...', 'cyan');
    let totalMigrated = 0;

    for (const tableName of TABLE_ORDER) {
      const neonInfo = neonTables.find((t) => t.name === tableName);
      const supabaseInfo = supabaseTables.find((t) => t.name === tableName);

      if (neonInfo && supabaseInfo) {
        const migrated = await migrateTable(tableName, neonInfo, supabaseInfo);
        totalMigrated += migrated;
      } else if (neonInfo && !supabaseInfo) {
        warn(`Skipping "${tableName}" (doesn't exist in Supabase)`);
      }
    }

    log(`\n✨ Migration complete! Migrated ${totalMigrated} total rows.`, 'green');
    info('\nNext steps:');
    info('  1. Verify your data in Supabase');
    info('  2. Run: pnpm prisma generate');
    info('  3. Test your application');
  } catch (err: any) {
    error(`Migration failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  } finally {
    await neonPool.end();
    await supabasePool.end();
  }
}

main();
