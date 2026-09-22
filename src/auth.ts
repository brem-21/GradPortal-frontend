import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import { SignJWT } from "jose";

const GMAIL_SEND = "https://www.googleapis.com/auth/gmail.send";

const AUTH_SECRET = process.env.AUTH_SECRET ?? "";
const ISSUER = process.env.AUTH_JWT_ISSUER ?? "gradportal-web";
const AUDIENCE = process.env.AUTH_JWT_AUDIENCE ?? "gradportal-api";
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000/api/v1";

/**
 * Whether the password-less development sign-in is available.
 *
 * Two independent gates, because this bypasses authentication entirely: the
 * flag must be set AND the build must not be production. Shipping with
 * ALLOW_DEV_SIGNIN left on in a production build still will not enable it.
 */
export const DEV_SIGNIN_ENABLED =
  process.env.ALLOW_DEV_SIGNIN === "true" && process.env.NODE_ENV !== "production";

/** A provider is only offered once it actually has credentials. */
export const GOOGLE_CONFIGURED = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);
export const LINKEDIN_CONFIGURED = Boolean(
  process.env.AUTH_LINKEDIN_ID && process.env.AUTH_LINKEDIN_SECRET,
);

/**
 * Mint the short-lived token the Python API verifies.
 *
 * Auth.js owns the OIDC dance with Google and LinkedIn; the backend never sees
 * a provider secret. It only has to trust this HS256 signature, which is why
 * AUTH_SECRET here and AUTH_JWT_SECRET in the backend must be byte-identical.
 */
async function mintApiToken(claims: {
  sub: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  provider?: string | null;
}): Promise<string> {
  const key = new TextEncoder().encode(AUTH_SECRET);
  return new SignJWT({
    email: claims.email,
    name: claims.name ?? undefined,
    picture: claims.picture ?? undefined,
    provider: claims.provider ?? undefined,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
}

/**
 * Hand the provider tokens to the API so it can send mail as this user later.
 * A failure here must not block sign-in — the user simply sees the "connect a
 * mailbox" prompt on the outreach screen instead.
 */
async function syncSession(
  apiToken: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/session/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.warn("[auth] session sync failed:", response.status, await response.text());
    }
  } catch (error) {
    console.warn("[auth] session sync unreachable:", error);
  }
}

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/signin", error: "/signin" },
  providers: [
    // Registering a provider without credentials produces a button that
    // dead-ends, so each is only added once it is actually configured.
    ...(GOOGLE_CONFIGURED
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            authorization: {
              params: {
                // gmail.send lets outreach leave from the user's own mailbox.
                scope: `openid email profile ${GMAIL_SEND}`,
                // Google returns a refresh token only on explicit offline consent.
                access_type: "offline",
                prompt: "consent",
              },
            },
          }),
        ]
      : []),
    ...(LINKEDIN_CONFIGURED
      ? [
          LinkedIn({
            clientId: process.env.AUTH_LINKEDIN_ID,
            clientSecret: process.env.AUTH_LINKEDIN_SECRET,
            // LinkedIn is an identity provider here; it cannot send mail.
            authorization: { params: { scope: "openid profile email" } },
          }),
        ]
      : []),
    ...(DEV_SIGNIN_ENABLED
      ? [
          Credentials({
            id: "dev",
            name: "Development sign-in",
            credentials: { email: { label: "Email", type: "email" } },
            /**
             * No password by design — this exists so the app can be exercised
             * before OAuth is registered, and a fake password would only imply
             * a security property it does not have. It is unreachable unless
             * ALLOW_DEV_SIGNIN is set on a non-production build.
             */
            async authorize(credentials) {
              const email = String(credentials?.email ?? "")
                .trim()
                .toLowerCase();
              if (!email.includes("@") || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
                return null;
              }
              // The API validates with email-validator, which rejects
              // special-use TLDs. Catching it here gives a usable error instead
              // of a session that authenticates and then fails on every call.
              const reserved = /\.(test|local|localhost|invalid|example|onion|internal|home\.arpa)$/;
              if (reserved.test(email.split("@")[1] ?? "")) return null;
              return {
                id: email,
                email,
                name: email.split("@")[0].replace(/[._-]+/g, " "),
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, account, profile, trigger }) {
      const email = (token.email ?? profile?.email) as string | undefined;
      if (!email) return token;

      const subject = token.sub ?? account?.providerAccountId ?? email;
      const apiToken = await mintApiToken({
        sub: subject,
        email,
        name: token.name,
        picture: token.picture as string | null | undefined,
        provider: account?.provider ?? (token.provider as string | undefined),
      });
      token.apiToken = apiToken;
      token.apiTokenExpires = Date.now() + 55 * 60 * 1000;

      if (account) {
        token.provider = account.provider;
        const scopes = account.scope ? account.scope.split(" ").filter(Boolean) : [];
        // Google and LinkedIn both implement plain OIDC, so the same claim set
        // arrives from either. Headline, positions and education are NOT here —
        // those need LinkedIn's partner-gated r_basicprofile product.
        const claims = (profile ?? {}) as Record<string, unknown>;
        const picture =
          (claims.picture as string | undefined) ??
          (token.picture as string | undefined) ??
          null;
        if (picture) token.picture = picture;

        await syncSession(apiToken, {
          email,
          full_name: (claims.name as string | undefined) ?? token.name ?? null,
          avatar_url: picture,
          provider_profile: {
            given_name: (claims.given_name as string | undefined) ?? null,
            family_name: (claims.family_name as string | undefined) ?? null,
            picture,
            locale:
              typeof claims.locale === "string"
                ? claims.locale
                : ((claims.locale as { language?: string; country?: string } | undefined)
                    ?.country
                    ? `${(claims.locale as { language?: string }).language ?? "en"}-${(claims.locale as { country?: string }).country}`
                    : null),
            email_verified: (claims.email_verified as boolean | undefined) ?? null,
          },
          account: {
            provider: account.provider,
            provider_account_id: account.providerAccountId,
            access_token: account.access_token ?? null,
            refresh_token: account.refresh_token ?? null,
            expires_at: account.expires_at
              ? new Date(account.expires_at * 1000).toISOString()
              : null,
            scopes,
          },
        });
        token.canSendMail = scopes.includes(GMAIL_SEND) && Boolean(account.refresh_token);
      } else if (trigger === "update") {
        await syncSession(apiToken, {
          email,
          full_name: token.name ?? null,
          avatar_url: (token.picture as string | undefined) ?? null,
        });
      }

      return token;
    },

    async session({ session, token }) {
      session.apiToken = token.apiToken as string | undefined;
      session.provider = token.provider as string | undefined;
      session.canSendMail = Boolean(token.canSendMail);
      if (session.user) {
        session.user.id = (token.sub as string) ?? session.user.id;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
