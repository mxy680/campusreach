#!/bin/bash

# Migration script from Neon to Supabase
# Usage: ./scripts/migrate-from-neon.sh

set -e

echo "🚀 Starting migration from Neon to Supabase..."

# Check if pg_dump and psql are available
if ! command -v pg_dump &> /dev/null; then
    echo "❌ pg_dump is not installed. Please install PostgreSQL client tools."
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed. Please install PostgreSQL client tools."
    exit 1
fi

# Check for required environment variables
if [ -z "$NEON_DATABASE_URL" ]; then
    echo "❌ NEON_DATABASE_URL environment variable is not set."
    echo "   Please set it with: export NEON_DATABASE_URL='postgresql://...'"
    exit 1
fi

if [ -z "$SUPABASE_DATABASE_URL" ]; then
    echo "❌ SUPABASE_DATABASE_URL environment variable is not set."
    echo "   Please set it with: export SUPABASE_DATABASE_URL='postgresql://...'"
    exit 1
fi

DUMP_FILE="neon_dump_$(date +%Y%m%d_%H%M%S).sql"

echo "📦 Step 1: Exporting data from Neon..."
pg_dump \
  --clean \
  --if-exists \
  --quote-all-identifiers \
  --no-owner \
  --no-privileges \
  --no-acl \
  --schema=public \
  "$NEON_DATABASE_URL" > "$DUMP_FILE"

if [ $? -ne 0 ]; then
    echo "❌ Failed to export from Neon"
    exit 1
fi

echo "✅ Data exported to $DUMP_FILE"
echo "📊 File size: $(du -h "$DUMP_FILE" | cut -f1)"

echo ""
echo "📥 Step 2: Importing data into Supabase..."
echo "⚠️  This will replace existing data in Supabase!"
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 1
fi

psql "$SUPABASE_DATABASE_URL" -f "$DUMP_FILE"

if [ $? -ne 0 ]; then
    echo "❌ Failed to import into Supabase"
    exit 1
fi

echo "✅ Migration completed successfully!"
echo "📁 Dump file saved as: $DUMP_FILE"
echo ""
echo "🔍 Next steps:"
echo "   1. Verify your data in Supabase"
echo "   2. Update your .env.local with the Supabase connection string"
echo "   3. Run: pnpm prisma generate"
echo "   4. Run: pnpm db:push (to sync schema)"

