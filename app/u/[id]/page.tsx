import { prisma } from "@/lib/prisma"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, GraduationCap, MapPin, Mail, Globe } from "lucide-react"

export const revalidate = 300

type Props = { params: Promise<{ id: string }> }

async function getVolunteer(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      volunteer: {
        select: {
          school: true,
          major: true,
          graduationDate: true,
          pronouns: true,
          transportMode: true,
          weeklyGoalHours: true,
        },
      },
    },
  })
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const user = await getVolunteer(id)
  if (!user) return {}
  const title = `${user.name ?? "Student"} | CampusReach`
  const description = `${user.volunteer?.major ?? "Volunteer"} at ${user.volunteer?.school ?? "Campus"}`
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary", title, description },
  }
}

export default async function PublicStudentPage({ params }: Props) {
  const { id } = await params
  const user = await getVolunteer(id)
  if (!user) return notFound()

  const v = user.volunteer

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100 flex items-center">
      <main className="mx-auto w-full max-w-4xl px-6 py-12 space-y-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40">
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border bg-white shadow-sm">
              {user.image ? (
                <Image src={user.image} alt={`${user.name ?? "Student"} avatar`} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Avatar</div>
              )}
            </div>
            <h1 className="text-3xl font-semibold md:text-4xl">{user.name ?? "Student"}</h1>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-sm">
              {v?.school && (
                <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                  <MapPin className="h-4 w-4" /> {v.school}
                </span>
              )}
              {v?.major && (
                <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                  <GraduationCap className="h-4 w-4" /> {v.major}
                </span>
              )}
              {v?.graduationDate && (
                <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                  <CalendarDays className="h-4 w-4" /> {new Date(v.graduationDate).getFullYear()}
                </span>
              )}
              {v?.weeklyGoalHours ? (
                <Badge variant="secondary" className="rounded-full">{v.weeklyGoalHours}h/week goal</Badge>
              ) : null}
            </div>
            {user.email && (
              <div className="mt-2 text-sm">
                <a href={`mailto:${user.email}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                  <Mail className="h-4 w-4" /> {user.email}
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Academics */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="space-y-2 p-6">
              <h2 className="text-base font-semibold">Academics</h2>
              <div className="text-sm text-muted-foreground">
                <div><span className="font-medium">School: </span>{v?.school ?? "—"}</div>
                <div><span className="font-medium">Major: </span>{v?.major ?? "—"}</div>
                <div><span className="font-medium">Graduation: </span>{v?.graduationDate ? new Date(v.graduationDate).toLocaleDateString() : "—"}</div>
                <div><span className="font-medium">Pronouns: </span>{v?.pronouns ?? "—"}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 p-6">
              <h2 className="text-base font-semibold">Goals</h2>
              <div className="text-sm text-muted-foreground">
                <div><span className="font-medium">Weekly hours goal: </span>{v?.weeklyGoalHours ?? "—"}</div>
                <div><span className="font-medium">Transport mode: </span>{v?.transportMode ?? "—"}</div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Links */}
        <section>
          <Card>
            <CardContent className="space-y-3 p-6">
              <h2 className="text-base font-semibold">Links</h2>
              <div className="flex flex-wrap gap-2 text-sm">
                {user.email && (
                  <a href={`mailto:${user.email}`} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-accent">
                    <Mail className="h-4 w-4" /> Email
                  </a>
                )}
                {v?.school && (
                  <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                    <Globe className="h-4 w-4" /> {v.school}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
