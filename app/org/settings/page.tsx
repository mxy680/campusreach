"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Page() {
  // Account info
  const [orgName, setOrgName] = React.useState("")
  const [orgEmail, setOrgEmail] = React.useState("")

  // Password
  const [currPassword, setCurrPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  return (
    <main className="p-4">
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="mb-3 grid w-full grid-cols-2">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardContent className="pt-4">
          <form
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              // TODO: wire to API
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization name</Label>
              <Input id="org-name" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Your Organization" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-email">Contact email</Label>
              <Input id="org-email" type="email" value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} placeholder="contact@org.org" />
            </div>
            <div className="md:col-span-2 flex justify-end pt-2">
              <Button type="submit">Save account</Button>
            </div>
          </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardContent className="pt-4">
          <form
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!newPassword || newPassword !== confirmPassword) return
              // TODO: wire to API
              setCurrPassword("")
              setNewPassword("")
              setConfirmPassword("")
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="curr-pass">Current password</Label>
              <Input id="curr-pass" type="password" value={currPassword} onChange={(e) => setCurrPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pass">New password</Label>
              <Input id="new-pass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pass">Confirm password</Label>
              <Input id="confirm-pass" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <div className="md:col-span-3 flex justify-end pt-2">
              <Button type="submit" disabled={!newPassword || newPassword !== confirmPassword}>Update password</Button>
            </div>
          </form>
            </CardContent>
          </Card>
        </TabsContent>
        
      </Tabs>
    </main>
  )
}
