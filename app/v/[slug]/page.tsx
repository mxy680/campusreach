import { prisma } from "@/lib/prisma"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, GraduationCap, MapPin } from "lucide-react"

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

async function getVolunteerBySlug(slug: string) {
  return prisma.volunteer.findFirst({
    where: { slug },
    select: {
      slug: true,
      firstName: true,
      lastName: true,
      pronouns: true,
      school: true,
      major: true,
      graduationDate: true,
      weeklyGoalHours: true,
      phone: true,
      user: { select: { email: true, image: true, name: true } },
    },
  })
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const v = await getVolunteerBySlug(slug)
  if (!v) return {}
  const fullName = `${v.firstName} ${v.lastName}`.trim()
  const title = `${fullName || "Student"} | CampusReach`
  const description = `${v.major ?? "Volunteer"} at ${v.school ?? "Campus"}`
  return { title, description, openGraph: { title, description }, twitter: { card: "summary", title, description } }
}

export default async function PublicVolunteerPage({ params }: Props) {
  const { slug } = await params
  const v = await getVolunteerBySlug(slug)
  if (!v) return notFound()

  const fullName = `${v.firstName} ${v.lastName}`.trim() || v.user?.name || "Student"

  return (
    <main className="min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-b from-primary/20 via-transparent to-transparent">
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="w-full max-w-4xl space-y-8">
          {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40">
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border bg-white shadow-sm">
              {v.user?.image ? (
                <Image src={v.user.image} alt={`${fullName} avatar`} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Avatar</div>
              )}
            </div>
            <h1 className="text-3xl font-semibold md:text-4xl">{fullName}</h1>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-sm">
              {v.school && (
                <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                  <MapPin className="h-4 w-4" /> {v.school}
                </span>
              )}
              {v.major && (
                <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                  <GraduationCap className="h-4 w-4" /> {v.major}
                </span>
              )}
              {v.graduationDate && (
                <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                  <CalendarDays className="h-4 w-4" /> {new Date(v.graduationDate).getFullYear()}
                </span>
              )}
              {v.weeklyGoalHours ? (
                <Badge variant="secondary" className="rounded-full">{v.weeklyGoalHours}h/week goal</Badge>
              ) : null}
            </div>
            {/* Email removed from hero; shown in Contact card below */}
          </div>
        </section>

        {/* Academics */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 px-6">
          <Card>
            <CardContent className="space-y-2 p-6">
              <h2 className="text-base font-semibold">Academics</h2>
              <div className="text-sm text-muted-foreground">
                <div><span className="font-medium">School: </span>{v.school ?? "—"}</div>
                <div><span className="font-medium">Major: </span>{v.major ?? "—"}</div>
                <div><span className="font-medium">Graduation: </span>{v.graduationDate ? new Date(v.graduationDate).toLocaleDateString() : "—"}</div>
                <div><span className="font-medium">Pronouns: </span>{v.pronouns ?? "—"}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 p-6">
              <h2 className="text-base font-semibold">Contact</h2>
              <div className="text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Email: </span>
                  {v.user?.email ? (
                    <a href={`mailto:${v.user.email}`} className="text-blue-600 hover:underline">{v.user.email}</a>
                  ) : (
                    "—"
                  )}
                </div>
                <div>
                  <span className="font-medium">Phone: </span>{v.phone ?? "—"}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
        </div>
      </div>
    </main>
  )
}
