import { api } from "@/lib/api";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Set up — GradPortal" };

export default async function OnboardingPage() {
  const me = await api.me();
  return (
    <OnboardingForm
      defaultFields={me.preference?.fields_of_study ?? []}
      defaultTypes={me.preference?.opportunity_types ?? []}
      defaultDegrees={me.preference?.degree_levels ?? []}
      defaultCountries={me.preference?.countries ?? []}
      defaultRegions={me.preference?.regions ?? []}
      defaultFunding={me.preference?.funding_types ?? []}
      defaultDigest={me.preference?.email_digest ?? "daily"}
      isMentor={me.profile?.is_mentor ?? false}
      providerAvatar={me.avatar_url}
    />
  );
}
