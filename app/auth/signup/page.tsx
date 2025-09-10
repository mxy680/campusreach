import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";

export default function Page() {
  return (
    <main className="relative min-h-[calc(100vh-4rem)] p-6 overflow-hidden">
      {/* Background animated grid */}
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.08}
        duration={3}
        repeatDelay={1}
        className={cn(
          "text-primary/40",
          "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-6"
        )}
      />
      <header className="mb-6 flex justify-end gap-2">
        <Button asChild variant="ghost">
          <Link href="/auth/signup">Sign up</Link>
        </Button>
        <Button asChild variant="default">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      </header>
      <div className="relative min-h-[calc(100vh-10rem)] flex items-center justify-center">
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
              <Button type="submit" className="w-full">Continue</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      </div>
    </main>
  );
}
