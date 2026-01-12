"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import type { User } from "@supabase/supabase-js"

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">CampusReach</h1>
        
        {user ? (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Logged in as:</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              Log out
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">Not logged in</p>
            <Button asChild>
              <a href="/auth/signup/volunteer">Sign up</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
