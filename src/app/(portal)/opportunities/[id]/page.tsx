import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { AskAboutButton } from "@/components/counsel";
import { EmailComposer } from "./email-composer";
import { SaveControl } from "./save-control";
import { Hairline, SectionLabel, Tag, TextArrowLink, cx } from "@/components/ui";
import {
  deadlineLabel,
  degreeLabel,
  fieldLabel,
  formatDate,
  fundingLabel,
  typeLabel,
} from "@/lib/format";
import type { Contact } from "@/types/api";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const opportunity = await api.opportunity(id);
    return { title: `${opportunity.title} — GradPortal` };
  } catch {
    return { title: "Opportunity — GradPortal" };
  }
}

/** Provenance matters: say where an address came from and how sure we are. */
function confidenceNote(contact: Contact): string {
  if (contact.verified) return "Verified — human-entered or successfully delivered to";
  if (contact.confidence >= 0.85) return "High confidence — named role on the source page";
  if (contact.confidence >= 0.7) return "Likely a named individual";
  if (contact.confidence >= 0.55) return "Departmental mailbox, not a named person";
  return "Low confidence — check the source page before writing";
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let opportunity;
  try {
    opportunity = await api.opportunity(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const [me, draft] = await Promise.all([
    api.me(),
    api.draftEmail({ opportunity_id: id }).catch(() => null),
  ]);

  const deadline = deadlineLabel(
    opportunity.application_deadline,
    opportunity.deadline_text,
    opportunity.days_until_deadline,
  );

  // Handed to both Counsel and the email refiner so neither has to re-fetch.
  const counselContext = {
    id: opportunity.id,
    title: opportunity.title,
    organization: opportunity.organization,
    opportunity_type: opportunity.opportunity_type,
    country: opportunity.country,
    funding_type: opportunity.funding_type,
    application_deadline: opportunity.application_deadline,
    degree_levels: opportunity.degree_levels,
    fields_of_study: opportunity.fields_of_study,
    description: opportunity.description?.slice(0, 4000) ?? null,
    url: opportunity.url,
  };

  const facts: [string, string | null][] = [
    ["Organisation", opportunity.organization],
    ["Department", opportunity.department],
    ["Location", opportunity.location ?? opportunity.country],
    ["Funding", fundingLabel(opportunity.funding_type)],
    ["Amount", opportunity.funding_amount],
    [
      "Degree level",
      opportunity.degree_levels.length
        ? opportunity.degree_levels.map(degreeLabel).join(", ")
        : null,
    ],
    [
      "International applicants",
      opportunity.open_to_international === null
        ? "Not stated on the listing"
        : opportunity.open_to_international
          ? "Explicitly welcome"
          : "Restricted — check eligibility",
    ],
    ["Deadline", opportunity.application_deadline ? formatDate(opportunity.application_deadline) : (opportunity.deadline_text ?? "Not stated")],
    ["Added", formatDate(opportunity.created_at)],
  ];

  return (
    <div className="py-12">
      <Link
        href="/opportunities"
        className="mb-8 inline-block text-[13px] text-smoke transition-colors hover:text-ink"
      >
        ← All opportunities
      </Link>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* ---------- Main column ---------- */}
        <div className="min-w-0">
          <SectionLabel>{typeLabel(opportunity.opportunity_type)}</SectionLabel>
          <h1 className="heading-lg mb-6">{opportunity.title}</h1>

          <div className="mb-5">
            <AskAboutButton
              opportunity={counselContext}
              label="Should I apply? Ask Counsel"
            />
          </div>

          <div className="mb-8 flex flex-wrap items-center gap-2">
            {opportunity.fields_of_study.map((field) => (
              <Tag key={field}>{fieldLabel(field)}</Tag>
            ))}
            {opportunity.funding_type !== "unknown" ? (
              <Tag tone="outline">{fundingLabel(opportunity.funding_type)}</Tag>
            ) : null}
            <Tag tone={deadline.urgent ? "ember" : "outline"}>{deadline.text}</Tag>
          </div>

          <Hairline />

          <section className="py-8">
            <SectionLabel>Description</SectionLabel>
            <div className="prose-column space-y-4 text-[15px] leading-[1.5] text-ink">
              {opportunity.description
                .split(/\n{2,}/)
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              {!opportunity.description ? (
                <p className="text-pewter">
                  No description was captured from the source. Open the original listing
                  below for the full text.
                </p>
              ) : null}
            </div>
          </section>

          <Hairline />

          <section className="py-8">
            <SectionLabel>Details</SectionLabel>
            <dl className="mt-2">
              {facts
                .filter(([, value]) => Boolean(value))
                .map(([label, value]) => (
                  <div
                    key={label}
                    className="hairline grid grid-cols-[minmax(120px,180px)_1fr] gap-4 py-3 text-[13px]"
                  >
                    <dt className="text-smoke">{label}</dt>
                    <dd className="text-ink">{value}</dd>
                  </div>
                ))}
            </dl>
          </section>

          <Hairline />

          {/* ---------- Contacts ---------- */}
          <section className="py-8">
            <SectionLabel>Who to contact</SectionLabel>
            <h2 className="heading mb-6">Contacts on this listing</h2>
            {opportunity.contacts.length === 0 ? (
              <p className="prose-column text-[15px] text-pewter">
                None found on the source page.
              </p>
            ) : (
              <ul className="space-y-3">
                {opportunity.contacts.map((contact) => (
                  <li
                    key={contact.id}
                    className="rounded-card border border-mist p-4"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="text-[15px] text-ink">
                        {contact.name ?? "Unnamed contact"}
                        {contact.role ? (
                          <span className="ml-2 text-[13px] text-pewter">
                            {contact.role}
                          </span>
                        ) : null}
                      </p>
                      {contact.is_primary ? <Tag tone="outline">Primary</Tag> : null}
                    </div>
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="mt-1 block text-[13px] text-ember hover:underline"
                      >
                        {contact.email}
                      </a>
                    ) : null}
                    {contact.phone ? (
                      <p className="mt-1 text-[13px] text-pewter">{contact.phone}</p>
                    ) : null}
                    <p
                      className={cx(
                        "mt-2 text-[12px]",
                        contact.confidence >= 0.8 ? "text-smoke" : "text-pewter",
                      )}
                    >
                      {confidenceNote(contact)}
                      {contact.source_url ? (
                        <>
                          {" · "}
                          <a
                            href={contact.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-ink hover:underline"
                          >
                            source
                          </a>
                        </>
                      ) : null}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ---------- Composer ---------- */}
          {draft ? (
            <section className="pt-4">
              <EmailComposer
                opportunityId={opportunity.id}
                contacts={opportunity.contacts}
                draft={draft}
                fromEmail={me.email}
                opportunity={counselContext}
              />
            </section>
          ) : null}
        </div>

        {/* ---------- Sidebar ---------- */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <SaveControl
            opportunityId={opportunity.id}
            isSaved={opportunity.is_saved}
            savedStatus={opportunity.saved_status}
          />

          <div className="rounded-card border border-mist p-4">
            <p className="section-label">Deadline</p>
            <p
              className={cx(
                "mt-1 text-[22px] font-light tracking-[-0.44px]",
                deadline.urgent ? "text-ember" : "text-ink",
              )}
            >
              {deadline.text}
            </p>
            {opportunity.application_deadline ? (
              <p className="mt-1 text-[12px] text-smoke">
                {formatDate(opportunity.application_deadline)}
              </p>
            ) : null}
          </div>

          <div className="rounded-card border border-mist p-4">
            <p className="section-label">Source</p>
            <p className="mt-1 text-[13px] text-ink">
              {opportunity.source_name ?? "Unknown"}
            </p>
            <div className="mt-4 space-y-3">
              <TextArrowLink href={opportunity.url} external>
                Open original listing
              </TextArrowLink>
              {opportunity.apply_url ? (
                <div>
                  <TextArrowLink href={opportunity.apply_url} external>
                    Go to application
                  </TextArrowLink>
                </div>
              ) : null}
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-smoke">
              Always confirm the deadline and eligibility on the source page — listings
              change after they are crawled.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
