import { prisma } from "@/lib/prisma"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Globe, Instagram, Twitter, Facebook, Linkedin, CalendarDays, MapPin } from "lucide-react"

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

async function getOrg(slug: string) {
  return prisma.organization.findFirst({
    where: { slug },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      logoUrl: true,
      description: true,
      mission: true,
      website: true,
      twitter: true,
      instagram: true,
      facebook: true,
      linkedin: true,
      categories: true,
      contacts: { select: { name: true, role: true, email: true, phone: true } },
      events: {
        select: { id: true, title: true, startsAt: true, location: true },
        orderBy: { startsAt: "desc" },
        take: 12,
      },
    },
  })
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const org = await getOrg(slug)
  if (!org) return {}
  const title = `${org.name} | CampusReach`
  const description = org.description?.slice(0, 160) || "Learn more about this organization on CampusReach."
  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: { card: "summary", title, description },
  }
}

export default async function OrgPublicPage({ params }: Props) {
  const { slug } = await params
  const org = await getOrg(slug)
  if (!org) return notFound()

  const SocialLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
    >
      {children}
    </a>
  )

  return (
    <main className="relative min-h-[calc(100vh-4rem)] px-4 py-8 md:py-12 flex justify-center">
      <div className="relative w-full max-w-5xl space-y-8">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-2xl border border-muted/40 bg-transparent shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 p-6 md:p-8 text-left">
              <div className="relative h-20 w-20 md:h-24 md:w-24 shrink-0 overflow-hidden rounded-xl border bg-white shadow-sm">
                {org.avatarUrl || org.logoUrl ? (
                  <Image src={(org.avatarUrl || org.logoUrl)!} alt={`${org.name} logo`} fill className="object-contain" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Logo</div>
                )}
              </div>
              <div className="flex-1 w-full">
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{org.name}</h1>
                {org.categories?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {org.categories.map((c, i) => (
                      <Badge key={c + i} variant="secondary" className="rounded-full">{c}</Badge>
                    ))}
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs md:text-sm">
                  {org.website && (
                    <a className="inline-flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-accent" href={org.website} target="_blank" rel="noreferrer">
                      <Globe className="h-4 w-4" /> Website
                    </a>
                  )}
                  {org.twitter && (
                    <SocialLink href={org.twitter}><Twitter className="h-3.5 w-3.5" /> Twitter</SocialLink>
                  )}
                  {org.instagram && (
                    <SocialLink href={org.instagram}><Instagram className="h-3.5 w-3.5" /> Instagram</SocialLink>
                  )}
                  {org.facebook && (
                    <SocialLink href={org.facebook}><Facebook className="h-3.5 w-3.5" /> Facebook</SocialLink>
                  )}
                  {org.linkedin && (
                    <SocialLink href={org.linkedin}><Linkedin className="h-3.5 w-3.5" /> LinkedIn</SocialLink>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* About & Mission */}
          <section className="grid grid-cols-1 gap-5 md:gap-6 md:grid-cols-2">
            <Card className="border-muted/40 shadow-sm">
              <CardContent className="space-y-3 p-6">
                <h2 className="text-base font-semibold">About</h2>
                <p className="max-w-prose text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{org.description || "No description provided yet."}</p>
              </CardContent>
            </Card>
            <Card className="border-muted/40 shadow-sm">
              <CardContent className="space-y-3 p-6">
                <h2 className="text-base font-semibold">Mission</h2>
                <p className="max-w-prose text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{org.mission || "No mission statement yet."}</p>
              </CardContent>
            </Card>
          </section>

          {/* Contacts */}
          <section>
            <Card className="border-muted/40 shadow-sm">
              <CardContent className="space-y-4 p-6">
                <h2 className="text-left text-base font-semibold">Contacts</h2>
                {org.contacts.length === 0 ? (
                  <div className="text-left text-sm text-muted-foreground">No contacts yet.</div>
                ) : (
                  <ul className="mx-auto grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
                    {org.contacts.map((c, i) => (
                      <li key={i} className="rounded-lg border p-4">
                        <div className="font-medium">{c.name}</div>
                        {c.role && <div className="text-xs text-muted-foreground">{c.role}</div>}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                          {c.email && (
                            <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                              <Mail className="h-3.5 w-3.5" /> {c.email}
                            </a>
                          )}
                          {c.phone && (
                            <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                              <Phone className="h-3.5 w-3.5" /> {c.phone}
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Hosted events */}
          <section>
            <Card className="border-muted/40 shadow-sm">
              <CardContent className="space-y-4 p-6">
                <h2 className="text-left text-base font-semibold">Hosted events</h2>
                {org.events && org.events.length > 0 ? (
                  <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {org.events.map((e) => (
                      <li key={e.id} className="rounded-lg border p-4">
                        <div className="font-medium">{e.title}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            {new Date(e.startsAt).toLocaleString()}
                          </span>
                          {e.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {e.location}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-left text-sm text-muted-foreground">No events yet.</div>
                )}
              </CardContent>
            </Card>
          </section>

      </div>
    </main>
  )
}
