"use server";

import { signIn } from "@/auth";

/**
 * Shared by the /signin page and the landing-page overlay, so both entry points
 * run the same flow rather than drifting apart.
 */
export async function signInWithGoogle(callbackUrl: string = "/overview") {
  await signIn("google", { redirectTo: callbackUrl });
}

export async function signInWithLinkedIn(callbackUrl: string = "/overview") {
  await signIn("linkedin", { redirectTo: callbackUrl });
}

/**
 * Development sign-in. The provider itself is only registered when
 * ALLOW_DEV_SIGNIN is set on a non-production build, so this throws rather than
 * authenticating anyone if it is called when disabled.
 */
export async function signInAsDevUser(callbackUrl: string, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  await signIn("dev", { email, redirectTo: callbackUrl });
}

export async function signInAsDemo(email: string, callbackUrl: string = "/overview") {
  await signIn("dev", { email, redirectTo: callbackUrl });
}
