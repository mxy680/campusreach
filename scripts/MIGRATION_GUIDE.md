# Data Migration Guide: Neon → Supabase

This guide explains how to migrate data from a Neon database to Supabase when the schemas are slightly different.

## Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set environment variables:**
   ```bash
   export NEON_DATABASE_URL="postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"
   export SUPABASE_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres?sslmode=require"
   ```
   
   ⚠️ **Important**: Use the **direct connection** for Supabase (port 5432), not the pooler!

3. **Run the migration:**
   ```bash
   pnpm migrate:neon
   ```

## What the Script Does

The migration script (`migrate-data-from-neon.ts`) will:

1. ✅ **Connect** to both Neon and Supabase databases
2. 📊 **Compare schemas** and identify differences
3. 🗑️ **Clear existing data** in Supabase (with confirmation)
4. 📦 **Migrate data** table by table, handling schema differences:
   - Only migrates columns that exist in both schemas
   - Skips columns that don't exist in the target
   - Handles foreign key dependencies automatically
   - Uses `ON CONFLICT DO NOTHING` to avoid duplicates

## Schema Differences

The script automatically handles:
- **Missing columns**: Columns in Neon but not Supabase are skipped
- **Extra columns**: Columns in Supabase but not Neon are left as default/null
- **Missing tables**: Tables that don't exist in Supabase are skipped with a warning

## Example Output

```
🚀 Starting data migration from Neon to Supabase

ℹ️  Testing database connections...
✅ Connected to Neon
✅ Connected to Supabase

📊 Comparing schemas between Neon and Supabase...
ℹ️  "Volunteer": 150 rows in Neon, 0 rows in Supabase
ℹ️  "Organization": 25 rows in Neon, 0 rows in Supabase
...

⚠️  Schema differences detected:
  - Table "OldTable": Columns in Neon but not Supabase: oldColumn1, oldColumn2
  - Table "Event": Columns in Supabase but not Neon: newField

⚠️  This will clear all existing data in Supabase!
Do you want to proceed? (yes/no): yes

🗑️  Clearing existing data in Supabase...
✅ Supabase data cleared

📦 Migrating data...
ℹ️  Migrating "Volunteer"...
✅   Migrated 150/150 rows from "Volunteer"
...

✨ Migration complete! Migrated 1234 total rows.
```

## Alternative: Full Schema Migration

If you want to migrate the entire schema (not just data), use the existing bash script:

```bash
export NEON_DATABASE_URL="..."
export SUPABASE_DATABASE_URL="..."
./scripts/migrate-from-neon.sh
```

This will:
- Export the entire schema + data from Neon
- Import everything into Supabase
- May fail if schemas are incompatible

## Troubleshooting

### Connection Issues
- Make sure you're using the **direct connection** for Supabase (port 5432)
- Ensure SSL is enabled (`?sslmode=require`)
- Check that both databases are accessible

### Schema Mismatches
- The script will show you all differences before migrating
- Review the differences and ensure they're acceptable
- You may need to manually adjust data for complex transformations

### Data Loss
- ⚠️ **Always backup your Neon database first!**
- The script clears Supabase data before migrating
- Consider testing on a Supabase branch first

### Large Databases
- The script processes data in batches of 100 rows
- For very large tables, you may want to migrate specific tables manually
- Monitor the migration progress

## Manual Migration

If you need more control, you can:

1. **Export specific tables from Neon:**
   ```bash
   pg_dump -t "Volunteer" -t "Organization" "$NEON_DATABASE_URL" > data.sql
   ```

2. **Transform the SQL** to match Supabase schema

3. **Import into Supabase:**
   ```bash
   psql "$SUPABASE_DATABASE_URL" -f data.sql
   ```

## After Migration

1. **Verify data:**
   ```bash
   pnpm db:studio
   ```

2. **Generate Prisma client:**
   ```bash
   pnpm prisma generate
   ```

3. **Test your application** to ensure everything works

4. **Update your `.env.local`** with Supabase connection strings
