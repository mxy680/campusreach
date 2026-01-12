"use client"

import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Combobox } from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"

const schools = [
  { value: "case-western", label: "Case Western Reserve University" },
]

const SCHOOL_NAME_MAP: Record<string, string> = {
  "case-western": "cwru",
}

function VolunteerSignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedSchool, setSelectedSchool] = useState<string>("")

  useEffect(() => {
    const error = searchParams.get("error")
    if (error === "invalid_domain") {
      toast.error("Invalid email domain", {
        description: "Only @case.edu email addresses can sign up as volunteers.",
      })
      // Clean up the URL
      router.replace("/auth/signup/volunteer")
    } else if (error === "email_exists") {
      toast.error("Email already registered", {
        description: "This email is already associated with an account.",
      })
      // Clean up the URL
      router.replace("/auth/signup/volunteer")
    }
  }, [searchParams, router])

  const handleContinue = () => {
    if (!selectedSchool) return
    const schoolName = SCHOOL_NAME_MAP[selectedSchool] || selectedSchool
    router.push(`/auth/signup/user/school/${encodeURIComponent(schoolName)}`)
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-b from-primary/20 via-transparent to-transparent">
      <header className="mb-6 flex justify-end">
        <Button asChild variant="default">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      </header>

      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Choose your university</h1>
              <p className="text-sm text-foreground/70">Select your school to continue with signup</p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleContinue(); }}>
                <div className="space-y-2">
                  <Label>School</Label>
                  <Combobox
                    options={schools}
                    value={selectedSchool}
                    onValueChange={setSelectedSchool}
                    placeholder="Select your school"
                    emptyText="No school found."
                  />
                </div>

                <Button type="submit" className="w-full" disabled={!selectedSchool}>
                  Continue
                </Button>

                <p className="text-xs text-foreground/70 text-center">
                  Organization?{' '}
                  <Link href="/auth/signup/organization" className="text-primary underline underline-offset-4">
                    Create an account
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

export default function VolunteerSignupPage() {
  return (
    <Suspense fallback={<main className="min-h-[calc(100vh-4rem)] p-6" />}>
      <VolunteerSignupContent />
    </Suspense>
  )
}

