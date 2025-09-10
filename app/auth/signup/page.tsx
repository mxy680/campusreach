import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-b from-primary/10 via-transparent to-transparent">
      <header className="mb-6 flex justify-end gap-2">
        <Button asChild variant="outline">
          <Link href="/auth/signup">Sign up</Link>
        </Button>
        <Button asChild variant="default">
          <Link href="/auth/signup">Sign in</Link>
        </Button>
      </header>
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
            <p className="text-sm text-foreground/70">Please use your school email to continue</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" required />
              </div>
              <Button type="submit" variant="default" className="w-full">Continue</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      </div>
    </main>
  );
}
