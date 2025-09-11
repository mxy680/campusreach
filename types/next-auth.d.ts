import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    profileComplete?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    profileComplete?: boolean;
  }
}
