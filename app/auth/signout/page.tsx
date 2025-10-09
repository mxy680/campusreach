import { Suspense } from "react";
import SignOutClient from "./signout-client";

export default function SignOutPage() {
  return (
    <Suspense fallback={<main className="min-h-[calc(100vh-4rem)] p-6" /> }>
      <SignOutClient />
    </Suspense>
  );
}
