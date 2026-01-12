# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev                    # Start Next.js dev server (localhost:3000)

# Build
pnpm build                  # Generate Prisma client and build Next.js

# Linting
pnpm lint                   # Run ESLint

# Database
pnpm db:generate            # Generate Prisma client
pnpm db:push                # Push schema to database (no migration)
pnpm db:migrate             # Create and apply migration
pnpm db:studio              # Open Prisma Studio
pnpm db:pull                # Pull schema from database
```

## Architecture

CampusReach is a volunteer management platform connecting student volunteers with organizations. It uses Next.js 16 App Router with Supabase for authentication and PostgreSQL via Prisma for data.

### Two User Types
- **Volunteers** (`/vol/*`): Students who sign up for events, track hours, rate experiences
- **Organizations** (`/org/*`): Nonprofits that create events and manage volunteers

User type is determined by checking `OrganizationMember` (org) or `Volunteer` (volunteer) records linked to the Supabase auth user ID. See `lib/user-type.ts` for `getUserType()` and `getUserData()` functions.

### Key Directories
- `app/api/vol/` - Volunteer API routes (profile, opportunities, messaging, ratings)
- `app/api/org/` - Organization API routes (opportunities, team, volunteers, messaging)
- `app/vol/` - Volunteer pages (dashboard, explore, profile, settings, messaging)
- `app/org/` - Organization pages (dashboard, opportunities, profile, settings, volunteers, messaging)
- `app/auth/` - Authentication flows (signin, signup/volunteer, signup/organization, callback)
- `components/` - React components including charts and sidebars
- `components/ui/` - Radix-based UI primitives (shadcn/ui pattern)
- `lib/supabase/` - Supabase client helpers (server.ts for Server Components, client.ts for Client Components)

### Database Schema (prisma/schema.prisma)
Core models:
- `Volunteer` - Student profile linked to Supabase user via `userId`
- `Organization` - Org profile with members
- `OrganizationMember` - Links Supabase users to organizations
- `Event` - Volunteer opportunities with signups, time entries, ratings
- `EventSignup` - Volunteer registration for events
- `TimeEntry` - Logged volunteer hours
- `EventRating` - Post-event volunteer feedback
- `GroupChat`/`ChatMessage` - Event-based messaging

### Auth Flow
OAuth via Supabase (Google). The callback at `app/auth/callback/route.ts` handles:
1. Completing OAuth exchange
2. Creating Volunteer or Organization records based on signup intent
3. Redirecting to appropriate dashboard (`/vol` or `/org`)

### Path Aliases
`@/*` maps to the project root (configured in tsconfig.json).
