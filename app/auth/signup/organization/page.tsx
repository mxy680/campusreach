import { Suspense } from "react";
import OrgSignupClient from "./org-client";

export default function Page() {
  return (
    <Suspense fallback={<main className="min-h-[calc(100vh-4rem)] p-6" /> }>
      <OrgSignupClient />
    </Suspense>
  );
}
