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

  if (me?.volunteer || me?.role === "VOLUNTEER") {
    redirect("/auth/signup/organization?error=EmailInUse");
  }

  redirect("/auth/signup/organization/profile");
}
