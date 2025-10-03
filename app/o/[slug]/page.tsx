import { prisma } from "@/lib/prisma"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Globe, Instagram, Twitter, Facebook, Linkedin } from "lucide-react"

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

async function getOrg(slug: string) {
  return prisma.organization.findFirst({
    where: { slug },
    select: {
      id: true,
      name: true,
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
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent">
      {children}
    </a>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100 flex items-center">
      <main className="mx-auto w-full max-w-5xl px-6 py-8 space-y-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40">
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-xl border bg-white shadow-sm">
              {org.logoUrl ? (
                <Image src={org.logoUrl} alt={`${org.name} logo`} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Logo</div>
              )}
            </div>
            <h1 className="text-3xl font-semibold md:text-4xl">{org.name}</h1>
            {org.categories?.length ? (
              <div className="mt-1 flex flex-wrap justify-center gap-1.5">
                {org.categories.map((c, i) => (
                  <Badge key={c + i} variant="secondary" className="rounded-full">{c}</Badge>
                ))}
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
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
        </section>

        {/* About & Mission */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="space-y-3 p-6 text-center">
              <h2 className="text-base font-semibold">About</h2>
              <p className="mx-auto max-w-prose text-sm text-muted-foreground whitespace-pre-line">{org.description || "No description provided yet."}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 p-6 text-center">
              <h2 className="text-base font-semibold">Mission</h2>
              <p className="mx-auto max-w-prose text-sm text-muted-foreground whitespace-pre-line">{org.mission || "No mission statement yet."}</p>
            </CardContent>
          </Card>
        </section>

        {/* Contacts */}
        <section>
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="text-center text-base font-semibold">Contacts</h2>
              {org.contacts.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground">No contacts yet.</div>
              ) : (
                <ul className="mx-auto grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
                  {org.contacts.map((c, i) => (
                    <li key={i} className="rounded-lg border p-4 text-center">
                      <div className="font-medium">{c.name}</div>
                      {c.role && <div className="text-xs text-muted-foreground">{c.role}</div>}
                      <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm">
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
      </main>
    </div>
  )
}
