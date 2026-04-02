import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      type?: string;
      banStatus?: string;
      account_status?: string;
      banReason?: string | null;
      banExpiresAt?: string | null;
    };
    accessToken?: string;
  }

  interface User {
    id: string;
    role?: string;
    type?: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    email?: string;
    name?: string;
    image?: string;
    banStatus?: string;
    banReason?: string;
    banExpiresAt?: string;
  }
}
