"use client";
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/auth/signin/user");
}
