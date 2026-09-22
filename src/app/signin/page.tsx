import Link from "next/link";
import { redirect } from "next/navigation";
import { DEV_SIGNIN_ENABLED, GOOGLE_CONFIGURED, LINKEDIN_CONFIGURED, auth } from "@/auth";
import { MediaSlideshow, SlideIndicator } from "@/components/media-slideshow";
import { DevSignIn } from "@/components/dev-signin";
import { ProviderButtons } from "@/components/provider-buttons";
import { Banner, SectionLabel } from "@/components/ui";
import { getSiteMedia, resolveSet } from "@/lib/site-content";

export const metadata = { title: "Sign in — GradPortal" };

const ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    "That email is already registered with a different provider. Sign in with the one you used first.",
  AccessDenied: "The provider declined the sign-in request.",
  Configuration:
    "Sign-in is not configured yet. Add the provider client ID and secret to frontend/.env.local.",
  Verification: "That sign-in link has expired. Try again.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/overview");

  const media = await getSiteMedia();
  const signinSet = resolveSet(media, "signin");

  const params = await searchParams;
  const error = params.error ? (ERRORS[params.error] ?? "Sign-in failed. Try again.") : null;
  const callbackUrl = params.callbackUrl ?? "/overview";

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Photographic half — the system's elevation tool. */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <MediaSlideshow set={signinSet} />
        <p className="animate-fade-up relative z-10 max-w-[340px] text-[15px] leading-relaxed text-paper">
          Programmes, scholarships and research posts in computing and data — with the
          person to write to on every one.
        </p>
        <div className="relative z-10">
          <Link href="/" className="wordmark block text-paper transition-opacity hover:opacity-90">
            GradPortal
          </Link>
          <SlideIndicator
            count={signinSet.slides.length}
            interval={signinSet.interval}
            className="mt-6"
          />
        </div>
      </div>

      {/* Form half */}
      <div className="flex flex-col justify-center px-6 py-16 md:px-16">
        <div className="animate-fade-up mx-auto w-full max-w-[440px]">
          <Link
            href="/"
            className="mb-10 inline-block text-[12px] text-smoke transition-colors hover:text-ink lg:hidden"
          >
            ← GradPortal
          </Link>

          <SectionLabel>Sign in or create an account</SectionLabel>
          <h1 className="heading mb-8">Continue to the portal</h1>

          {error ? (
            <div className="mb-6">
              <Banner tone="error">{error}</Banner>
            </div>
          ) : null}

          <ProviderButtons
            callbackUrl={callbackUrl}
            tone="light"
            google={GOOGLE_CONFIGURED}
            linkedin={LINKEDIN_CONFIGURED}
          />

          {DEV_SIGNIN_ENABLED ? (
            <div className="mt-6">
              <DevSignIn callbackUrl={callbackUrl} />
            </div>
          ) : null}

          <div className="mt-8 space-y-4 border-t border-mist pt-6">
            <p className="text-[12px] leading-relaxed text-pewter">
              New here? Signing in creates your account. You will pick the opportunity
              types and fields you care about on the next screen.
            </p>
            <p className="text-[12px] leading-relaxed text-smoke">
              We store your provider refresh token encrypted, and use it only to send
              the enquiry emails you write and approve. Nothing is ever sent on your
              behalf without you pressing send.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
