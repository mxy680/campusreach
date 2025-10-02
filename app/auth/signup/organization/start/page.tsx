import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/signin?from=/auth/signup/organization/start");
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { volunteer: true },
  });

  // If the user already has a volunteer profile, this email is in use for a volunteer account.
  if (me?.volunteer) {
    redirect("/auth/signup/organization?error=EmailInUse");
  }

  // Ensure role is set to ORGANIZATION for org onboarding.
  if (me?.role !== "ORGANIZATION") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "ORGANIZATION" },
    });
  }

  redirect("/auth/signup/organization/profile");
}
