/**
 * Script to extract all volunteers who participated in a specific event
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/extract-event-volunteers.ts
 * 
 * Or create .env.prod file with:
 *   DATABASE_URL=postgresql://...
 * 
 * Then run:
 *   npx tsx scripts/extract-event-volunteers.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

// Load .env.prod if it exists
const envProdPath = path.join(process.cwd(), ".env.prod");
if (fs.existsSync(envProdPath)) {
  const envContent = fs.readFileSync(envProdPath, "utf-8");
  const lines = envContent.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, "");
        if (key.trim() === "DATABASE_URL") {
          process.env.DATABASE_URL = cleanValue;
        }
      }
    }
  }
  console.log("Loaded DATABASE_URL from .env.prod");
} else {
  console.warn("Warning: .env.prod not found. Using DATABASE_URL from environment.");
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Error: DATABASE_URL not found in environment or .env.prod");
  process.exit(1);
}

const EVENT_ID = "cmhl17o1y0000jm04bmzt5equ";

// Create Prisma client with production database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
  log: ["error"],
});

interface VolunteerData {
  signupId: string;
  signupStatus: string;
  signupCreatedAt: string;
  volunteerId: string;
  volunteerSlug: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  pronouns: string | null;
  email: string;
  phone: string | null;
  school: string | null;
  major: string | null;
  graduationDate: string | null;
  userId: string;
  userImage: string | null;
}

async function extractVolunteers() {
  try {
    console.log(`Extracting volunteers for event: ${EVENT_ID}`);
    console.log("Connecting to database...\n");

    // First, verify the event exists
    const event = await prisma.event.findUnique({
      where: { id: EVENT_ID },
      select: {
        id: true,
        title: true,
        startsAt: true,
        organization: { select: { name: true } },
      },
    });

    if (!event) {
      console.error(`Error: Event with id ${EVENT_ID} not found`);
      process.exit(1);
    }

    console.log(`Event: ${event.title}`);
    console.log(`Date: ${event.startsAt.toISOString()}`);
    console.log(`Organization: ${event.organization?.name ?? "N/A"}`);
    console.log("\nFetching volunteers...\n");

    // Get all signups for this event
    const signups = await prisma.eventSignup.findMany({
      where: { eventId: EVENT_ID },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        volunteer: {
          select: {
            id: true,
            slug: true,
            firstName: true,
            lastName: true,
            pronouns: true,
            school: true,
            major: true,
            graduationDate: true,
            phone: true,
            user: {
              select: {
                id: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (signups.length === 0) {
      console.log("No volunteers found for this event.");
      await prisma.$disconnect();
      return;
    }

    // Transform the data
    const volunteers: VolunteerData[] = signups.map((signup) => ({
      signupId: signup.id,
      signupStatus: signup.status,
      signupCreatedAt: signup.createdAt.toISOString(),
      volunteerId: signup.volunteer.id,
      volunteerSlug: signup.volunteer.slug,
      firstName: signup.volunteer.firstName,
      lastName: signup.volunteer.lastName,
      fullName: `${signup.volunteer.firstName} ${signup.volunteer.lastName}`.trim(),
      pronouns: signup.volunteer.pronouns,
      email: signup.volunteer.user?.email ?? "",
      phone: signup.volunteer.phone,
      school: signup.volunteer.school,
      major: signup.volunteer.major,
      graduationDate: signup.volunteer.graduationDate?.toISOString() ?? null,
      userId: signup.volunteer.user?.id ?? "",
      userImage: signup.volunteer.user?.image ?? null,
    }));

    // Output results
    console.log(`Found ${volunteers.length} volunteer(s):\n`);
    console.log("=".repeat(80));
    
    volunteers.forEach((v, idx) => {
      console.log(`\n${idx + 1}. ${v.fullName}`);
      console.log(`   Email: ${v.email}`);
      console.log(`   Phone: ${v.phone ?? "N/A"}`);
      console.log(`   School: ${v.school ?? "N/A"}`);
      console.log(`   Major: ${v.major ?? "N/A"}`);
      console.log(`   Pronouns: ${v.pronouns ?? "N/A"}`);
      console.log(`   Signup Status: ${v.signupStatus}`);
      console.log(`   Signed Up: ${v.signupCreatedAt}`);
    });

    console.log("\n" + "=".repeat(80));

    // Save to JSON file
    const outputFile = `event-volunteers-${EVENT_ID}-${new Date().toISOString().split("T")[0]}.json`;
    const outputPath = path.join(process.cwd(), outputFile);
    
    const output = {
      event: {
        id: EVENT_ID,
        title: event.title,
        startsAt: event.startsAt.toISOString(),
        organization: event.organization?.name ?? null,
      },
      extractedAt: new Date().toISOString(),
      totalVolunteers: volunteers.length,
      volunteers,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n✅ Data saved to: ${outputFile}`);

    // Also create a CSV for easy viewing
    const csvFile = `event-volunteers-${EVENT_ID}-${new Date().toISOString().split("T")[0]}.csv`;
    const csvPath = path.join(process.cwd(), csvFile);
    
    const csvHeaders = [
      "Full Name",
      "Email",
      "Phone",
      "School",
      "Major",
      "Pronouns",
      "Signup Status",
      "Signed Up At",
    ];
    
    const csvRows = volunteers.map((v) => [
      v.fullName,
      v.email,
      v.phone ?? "",
      v.school ?? "",
      v.major ?? "",
      v.pronouns ?? "",
      v.signupStatus,
      v.signupCreatedAt,
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    fs.writeFileSync(csvPath, csvContent);
    console.log(`✅ CSV saved to: ${csvFile}`);

  } catch (error) {
    console.error("Error extracting volunteers:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

extractVolunteers();

