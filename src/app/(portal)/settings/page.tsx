import Link from "next/link";
import { api } from "@/lib/api";
import { serviceHealth } from "@/lib/ai-api";
import { PreferencesForm } from "../profile/forms";
import { DangerZone } from "./danger-zone";
import { Banner, Hairline, SectionLabel, Tag } from "@/components/ui";

export const metadata = { title: "Settings — GradPortal" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [me, health] = await Promise.all([api.me(), serviceHealth()]);

  const services = [
    { key: "doc" as const, label: "Dossier indexing", health: health.doc },
    { key: "rag" as const, label: "Counsel", health: health.rag },
    { key: "evaluation" as const, label: "The Committee", health: health.evaluation },
    { key: "voice" as const, label: "Voice", health: health.voice },
  ];

  return (
    <div className="py-12">
      <SectionLabel>Your account</SectionLabel>
      <h1 className="heading-lg mb-10">Settings</h1>

      <section className="mb-16">
        <h2 className="heading mb-2">Matching and alerts</h2>
        <p className="prose-column mb-8 text-[15px] text-pewter">
          These drive your feed, how matches are ranked, and what you get emailed
          about.
        </p>
        <PreferencesForm preference={me.preference} />
      </section>

      <Hairline />

      <section className="my-16">
        <h2 className="heading mb-2">Sending email</h2>
        <p className="prose-column mb-5 text-[15px] text-pewter">
          Enquiries to opportunity contacts go out from your own mailbox, so replies
          reach you directly.
        </p>
        {me.can_send_email_as_self ? (
          <Banner>
            Connected. Emails send from{" "}
            <span className="text-ink">{me.email}</span> and appear in your Sent
            folder.
          </Banner>
        ) : (
          <Banner tone="warning">
            No mailbox connected. Sign out and sign back in with Google, accepting the
            send permission, and enquiries will come from your own address instead of
            being blocked.
          </Banner>
        )}
      </section>

      <Hairline />

      <section className="my-16">
        <h2 className="heading mb-2">Service status</h2>
        <p className="prose-column mb-6 text-[15px] text-pewter">
          What is running and what is missing a key. A degraded service disables one
          feature; it does not break the rest of the portal.
        </p>
        <ul>
          {services.map((service) => {
            const missing = Object.entries(service.health?.checks ?? {}).filter(
              ([, value]) => !String(value).startsWith("ok") && value !== "configured",
            );
            return (
              <li
                key={service.key}
                className="hairline flex flex-wrap items-center justify-between gap-3 py-4 first:border-t-0 first:pt-0"
              >
                <span className="text-[15px] text-ink">{service.label}</span>
                <span className="flex items-center gap-3">
                  {missing.length > 0 ? (
                    <span className="text-[12px] text-pewter">
                      {missing.map(([key, value]) => `${key}: ${value}`).join(" · ")}
                    </span>
                  ) : null}
                  <Tag tone={service.health === null ? "ember" : missing.length ? "ember" : "outline"}>
                    {service.health === null
                      ? "Not running"
                      : missing.length
                        ? "Degraded"
                        : "Healthy"}
                  </Tag>
                </span>
              </li>
            );
          })}
          <Hairline />
        </ul>
      </section>

      <Hairline />

      <section className="mt-16">
        <h2 className="heading mb-2">Account</h2>
        <p className="prose-column mb-6 text-[15px] text-pewter">
          Signed in as <span className="text-ink">{me.email}</span>. Edit your name,
          photo and background on your{" "}
          <Link href="/profile" className="text-ember hover:underline">
            profile
          </Link>
          .
        </p>
        <DangerZone email={me.email} />
      </section>
    </div>
  );
}
