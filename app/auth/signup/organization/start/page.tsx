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

  // If this email already belongs to a volunteer account, do NOT create/convert to an organization
  if (me?.volunteer) {
    // Send them to the app; middleware will route volunteers appropriately
    redirect("/");
  }

  // Otherwise, proceed with org onboarding. First, cancel any pending join requests.
  await prisma.organizationJoinRequest.updateMany({
    where: { userId: session.user.id, status: "PENDING" },
    data: { status: "DECLINED" },
  });

  // Ensure role is set to ORGANIZATION for org onboarding.
  if (me?.role !== "ORGANIZATION") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "ORGANIZATION" },
    });
  }

  redirect("/auth/signup/organization/profile");
}
