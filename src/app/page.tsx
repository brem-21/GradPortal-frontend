import { redirect } from "next/navigation";
import { DEV_SIGNIN_ENABLED, GOOGLE_CONFIGURED, LINKEDIN_CONFIGURED, auth } from "@/auth";
import { LandingPage } from "@/components/landing";
import {
  getSiteMedia,
  getSiteStories,
  resolveGallery,
  resolveSet,
} from "@/lib/site-content";

export const metadata = {
  title: "GradPortal — graduate openings, scholarships and the people behind them",
};

export default async function Page() {
  const session = await auth();
  if (session?.user) redirect("/overview");

  const [media, stories] = await Promise.all([getSiteMedia(), getSiteStories()]);
  return (
    <LandingPage
      signInConfig={{
        google: GOOGLE_CONFIGURED,
        linkedin: LINKEDIN_CONFIGURED,
        dev: DEV_SIGNIN_ENABLED,
      }}
      content={{
        hero: resolveSet(media, "hero"),
        closing: resolveSet(media, "closing"),
        mentorCard: resolveSet(media, "mentor_card"),
        footer: resolveSet(media, "footer"),
        gallery: resolveGallery(media),
        stories,
      }}
    />
  );
}
