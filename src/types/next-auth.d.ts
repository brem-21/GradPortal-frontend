import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    /** HS256 bearer token the Python API verifies. Re-minted on every jwt callback. */
    apiToken?: string;
    provider?: string;
    /** True when the linked account carries a Gmail/Graph send grant. */
    canSendMail?: boolean;
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    apiToken?: string;
    apiTokenExpires?: number;
    provider?: string;
    canSendMail?: boolean;
  }
}
