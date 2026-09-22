#!/usr/bin/env node
/**
 * Verify Google and LinkedIn OAuth configuration before trying to sign in.
 *
 *   npm run check:oauth
 *
 * Checks what can be checked without a browser: that the variables are
 * present and well-formed, that each provider's OIDC discovery document is
 * reachable and advertises what we need, and that the frontend and backend
 * agree on the signing secret. Prints the exact redirect URIs to register.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

const GREEN = "\x1b[32m", RED = "\x1b[31m", YELLOW = "\x1b[33m", DIM = "\x1b[2m", OFF = "\x1b[0m";
const ok = (m, d) => console.log(`  ${GREEN}ok${OFF}   ${m}${d ? `  ${DIM}${d}${OFF}` : ""}`);
const bad = (m, d) => { console.log(`  ${RED}FAIL${OFF} ${m}${d ? `\n         ${d}` : ""}`); failures++; };
const warn = (m, d) => { console.log(`  ${YELLOW}warn${OFF} ${m}${d ? `\n         ${d}` : ""}`); };

let failures = 0;

async function readEnv(file) {
  try {
    const text = await readFile(file, "utf8");
    return Object.fromEntries(
      text
        .split("\n")
        .filter((line) => line.includes("=") && !line.trimStart().startsWith("#"))
        .map((line) => {
          const at = line.indexOf("=");
          return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
        }),
    );
  } catch {
    return null;
  }
}

async function discovery(url, label, needed) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return bad(`${label} discovery`, `${url} returned ${response.status}`);
    const doc = await response.json();
    const missing = needed.filter((key) => !doc[key]);
    if (missing.length) {
      return bad(`${label} discovery`, `missing ${missing.join(", ")}`);
    }
    ok(`${label} discovery reachable`, new URL(doc.authorization_endpoint).host);
    return doc;
  } catch (error) {
    return bad(`${label} discovery`, `${url} — ${error.message}`);
  }
}

const front = (await readEnv(".env.local")) ?? {};
const backEnv = (await readEnv(path.join("..", "GradPortal-backend", "backend", ".env"))) ?? null;

const authUrl = (front.AUTH_URL || "http://localhost:3000").replace(/\/$/, "");

console.log("\n── Secrets ─────────────────────────────────────────────");
if (!front.AUTH_SECRET) bad("AUTH_SECRET is not set in frontend/.env.local");
else if (front.AUTH_SECRET.length < 32)
  bad("AUTH_SECRET is too short", "use at least 32 characters; bootstrap keygen prints one");
else ok("AUTH_SECRET set", `${front.AUTH_SECRET.length} chars`);

if (!backEnv) {
  warn("Could not read backend/.env", "skipping the shared-secret comparison");
} else if (!backEnv.AUTH_JWT_SECRET) {
  bad("AUTH_JWT_SECRET is not set in backend/.env");
} else if (backEnv.AUTH_JWT_SECRET !== front.AUTH_SECRET) {
  bad(
    "AUTH_SECRET and AUTH_JWT_SECRET differ",
    "they must be byte-identical or every API call will 401 after a successful sign-in",
  );
} else {
  ok("Frontend and backend share the signing secret");
}

console.log("\n── Google ──────────────────────────────────────────────");
const gid = front.AUTH_GOOGLE_ID, gsecret = front.AUTH_GOOGLE_SECRET;
if (!gid || !gsecret) {
  warn("Not configured", "the Google button is hidden until AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are set");
} else {
  if (!gid.endsWith(".apps.googleusercontent.com")) {
    bad("AUTH_GOOGLE_ID does not look like a Google client id",
        "it should end in .apps.googleusercontent.com");
  } else ok("Client id looks right", gid.slice(0, 24) + "…");

  if (gsecret.startsWith("GOCSPX-")) ok("Client secret looks right");
  else warn("Client secret has an unexpected prefix", "Google web-app secrets normally start GOCSPX-");

  await discovery(
    "https://accounts.google.com/.well-known/openid-configuration",
    "Google",
    ["authorization_endpoint", "token_endpoint", "jwks_uri"],
  );

  console.log(`  ${DIM}redirect URI to register:${OFF}`);
  console.log(`         ${authUrl}/api/auth/callback/google`);
  console.log(`  ${DIM}also required: enable the Gmail API, and add the scope${OFF}`);
  console.log(`         https://www.googleapis.com/auth/gmail.send`);
}

console.log("\n── LinkedIn ────────────────────────────────────────────");
const lid = front.AUTH_LINKEDIN_ID, lsecret = front.AUTH_LINKEDIN_SECRET;
if (!lid || !lsecret) {
  warn("Not configured", "the LinkedIn button is hidden until AUTH_LINKEDIN_ID and AUTH_LINKEDIN_SECRET are set");
} else {
  ok("Client id set", lid.slice(0, 10) + "…");
  await discovery(
    "https://www.linkedin.com/oauth/.well-known/openid-configuration",
    "LinkedIn",
    ["authorization_endpoint", "token_endpoint", "jwks_uri"],
  );
  console.log(`  ${DIM}redirect URL to register:${OFF}`);
  console.log(`         ${authUrl}/api/auth/callback/linkedin`);
  console.log(`  ${DIM}also required: request the product${OFF} "Sign In with LinkedIn using OpenID Connect"`);
}

console.log("\n── Runtime ─────────────────────────────────────────────");
if (front.ALLOW_DEV_SIGNIN === "true") {
  warn("Development sign-in is ON", "set ALLOW_DEV_SIGNIN=false before deploying");
} else ok("Development sign-in is off");

try {
  // A cold Next dev route can take well over ten seconds to compile on first
  // hit, so a short timeout here reports a running app as down.
  const response = await fetch(`${authUrl}/api/auth/providers`, {
    signal: AbortSignal.timeout(30000),
  });
  if (response.ok) {
    const providers = Object.keys(await response.json());
    ok("Providers the running app offers", providers.join(", ") || "none");
    for (const [key, id] of [[gid, "google"], [lid, "linkedin"]]) {
      if (key && !providers.includes(id)) {
        bad(`${id} is configured but not offered`, "restart the dev server to pick up .env.local");
      }
    }
  } else warn("App is running but /api/auth/providers returned " + response.status);
} catch {
  warn("App is not running", `start it with npm run dev to check the live provider list`);
}

console.log(
  `\n${failures === 0 ? GREEN + "  Configuration looks good." : RED + `  ${failures} problem(s) to fix.`}${OFF}\n`,
);
process.exit(failures === 0 ? 0 : 1);
