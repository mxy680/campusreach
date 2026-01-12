# Migrating Data from Neon to Supabase

This guide will help you migrate your existing data from Neon to Supabase.

## Prerequisites

1. **PostgreSQL client tools** installed (`pg_dump` and `psql`)
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql-client`
   - Windows: Install PostgreSQL from https://www.postgresql.org/download/

2. **Connection strings**:
   - Neon database connection string
   - Supabase direct connection string (not the pooler, for migrations)

## Step 1: Get Your Connection Strings

### Neon Connection String
Get your Neon connection string from your Neon dashboard. It should look like:
```
postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

### Supabase Direct Connection String
For Supabase, you need the **direct connection** (not the pooler) for migrations:
```
postgresql://postgres:YOUR_PASSWORD@db.yjggeycmbkluvuzcdshh.supabase.co:5432/postgres?sslmode=require
```

You can find this in your Supabase dashboard under:
**Settings → Database → Connection string → Direct connection**

## Step 2: Export from Neon

```bash
# Set your Neon connection string
export NEON_DATABASE_URL="postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"

# Export the database
pg_dump \
  --clean \
  --if-exists \
  --quote-all-identifiers \
  --no-owner \
  --no-privileges \
  --no-acl \
  --schema=public \
  "$NEON_DATABASE_URL" > neon_dump.sql
```

## Step 3: Import into Supabase

```bash
# Set your Supabase direct connection string
export SUPABASE_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.yjggeycmbkluvuzcdshh.supabase.co:5432/postgres?sslmode=require"

# Import the data
psql "$SUPABASE_DATABASE_URL" -f neon_dump.sql
```

## Step 4: Using the Migration Script

Alternatively, you can use the provided script:

```bash
# Set both connection strings
export NEON_DATABASE_URL="postgresql://..."
export SUPABASE_DATABASE_URL="postgresql://..."

# Run the migration script
./scripts/migrate-from-neon.sh
```

## Step 5: Update Your Project

After migration:

1. **Update .env.local** with your Supabase connection strings:
   ```bash
   DATABASE_URL="postgresql://postgres.yjggeycmbkluvuzcdshh:tLE7SUOV1oYmgUVx@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
   DIRECT_URL="postgresql://postgres:tLE7SUOV1oYmgUVx@db.yjggeycmbkluvuzcdshh.supabase.co:5432/postgres?sslmode=require"
   ```

2. **Generate Prisma client**:
   ```bash
   pnpm prisma generate
   ```

3. **Verify the schema matches**:
   ```bash
   pnpm db:pull  # This will update your schema if there are differences
   ```

4. **Test the connection**:
   ```bash
   pnpm db:studio  # Open Prisma Studio to verify your data
   ```

## Troubleshooting

### Connection Issues
- Make sure you're using the **direct connection** for Supabase (port 5432), not the pooler
- Ensure SSL is enabled (`?sslmode=require`)
- Check that your Supabase project is active

### Schema Differences
If you encounter errors during import:
1. The schema might have slight differences
2. Run `pnpm db:pull` to sync your Prisma schema with Supabase
3. Re-run the migration if needed

### Large Databases
For databases larger than a few GB:
- Consider migrating in chunks
- Use `--schema=public` to only migrate the public schema
- Monitor the import progress

## Important Notes

⚠️ **Backup First**: Always backup your Neon database before migration
⚠️ **Test Environment**: Consider testing on a Supabase branch first
⚠️ **Downtime**: Plan for some downtime during migration
⚠️ **Verify Data**: Always verify your data after migration

