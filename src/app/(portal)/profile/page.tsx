import { api } from "@/lib/api";
import { PreferencesForm, ProfileForm } from "./forms";
import { Hairline, SectionLabel, Tag } from "@/components/ui";

export const metadata = { title: "Profile — GradPortal" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const me = await api.me();

  return (
    <div className="py-12">
      <SectionLabel>Your account</SectionLabel>
      <h1 className="heading-lg mb-3">{me.full_name ?? me.email}</h1>
      <div className="mb-12 flex flex-wrap items-center gap-3">
        <p className="text-[13px] text-pewter">{me.email}</p>
        <Tag tone="outline">{me.role === "admin" ? "Community admin" : me.role === "mentor" ? "Mentor" : "Applicant"}</Tag>
        <Tag tone={me.can_send_email_as_self ? "outline" : "ember"}>
          {me.can_send_email_as_self ? "Mailbox connected" : "Mailbox not connected"}
        </Tag>
      </div>

      {!me.can_send_email_as_self ? (
        <div className="mb-12 rounded-card border border-ember/30 px-4 py-[14px] text-[13px]">
          To email opportunity contacts from your own address, sign out and sign back in
          with Google, accepting the &ldquo;send email on your behalf&rdquo; permission.
          We store that grant encrypted and use it only for the emails you write and
          press send on.
        </div>
      ) : null}

      <section className="mb-16">
        <h2 className="heading mb-2">What you are looking for</h2>
        <p className="prose-column mb-8 text-[15px] text-pewter">
          These drive your feed, your match ranking and the alerts you get when
          something new appears.
        </p>
        <PreferencesForm preference={me.preference} />
      </section>

      <Hairline />

      <section className="mt-16">
        <h2 className="heading mb-2">Profile</h2>
        <p className="prose-column mb-8 text-[15px] text-pewter">
          Your background is used to prefill enquiry emails, and — if you mentor — is
          what applicants see in the directory.
        </p>
        <ProfileForm profile={me.profile} avatarUrl={me.avatar_url} />
      </section>
    </div>
  );
}
