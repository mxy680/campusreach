-- Clear all data from the database
-- WARNING: This will permanently delete all data from all tables!

-- Disable foreign key checks temporarily for faster deletion
SET session_replication_role = 'replica';

-- Delete all data from all tables (in dependency order)
TRUNCATE TABLE "ChatMessage" CASCADE;
TRUNCATE TABLE "GroupChat" CASCADE;
TRUNCATE TABLE "EventSignup" CASCADE;
TRUNCATE TABLE "EventRating" CASCADE;
TRUNCATE TABLE "TimeEntry" CASCADE;
TRUNCATE TABLE "Event" CASCADE;
TRUNCATE TABLE "OrganizationJoinRequest" CASCADE;
TRUNCATE TABLE "SignupIntent" CASCADE;
TRUNCATE TABLE "OrganizationContact" CASCADE;
TRUNCATE TABLE "OrganizationMember" CASCADE;
TRUNCATE TABLE "Organization" CASCADE;
TRUNCATE TABLE "Volunteer" CASCADE;
TRUNCATE TABLE "NotificationPreference" CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Alternative: If you want to reset sequences as well (for auto-incrementing IDs, though this schema uses cuid())
-- You can add: RESTART IDENTITY CASCADE to each TRUNCATE statement
