import Link from "next/link";
import { Arrow, Tag, cx } from "./ui";
import { deadlineLabel, fieldLabel, fundingLabel, typeLabel } from "@/lib/format";
import type { Opportunity } from "@/types/api";

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const deadline = deadlineLabel(
    opportunity.application_deadline,
    opportunity.deadline_text,
    opportunity.days_until_deadline,
  );
  const contact = opportunity.contacts.find((c) => c.email);

  return (
    <article className="group hairline py-7 first:border-t-0 first:pt-0">
      <Link href={`/opportunities/${opportunity.id}`} className="block">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-smoke">
              <span>{typeLabel(opportunity.opportunity_type)}</span>
              {opportunity.organization ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-pewter">{opportunity.organization}</span>
                </>
              ) : null}
              {opportunity.country ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{opportunity.country}</span>
                </>
              ) : null}
              {opportunity.is_remote ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Remote</span>
                </>
              ) : null}
            </div>

            <h3 className="text-[22px] font-light leading-[1.25] tracking-[-0.44px] text-ink transition-colors duration-200 group-hover:text-ember">
              {opportunity.title}
            </h3>

            {opportunity.summary ? (
              <p className="prose-column mt-2 line-clamp-2 text-[13px] leading-relaxed text-pewter">
                {opportunity.summary}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {opportunity.fields_of_study.map((field) => (
                <Tag key={field}>{fieldLabel(field)}</Tag>
              ))}
              {opportunity.funding_type !== "unknown" ? (
                <Tag tone="outline">{fundingLabel(opportunity.funding_type)}</Tag>
              ) : null}
              {opportunity.open_to_international ? (
                <Tag tone="outline">Open to international</Tag>
              ) : null}
              {contact ? <Tag tone="ember">Contact available</Tag> : null}
              {opportunity.is_saved ? <Tag tone="outline">On your list</Tag> : null}
            </div>
          </div>

          <div className="hidden w-[150px] shrink-0 text-right sm:block">
            <p
              className={cx(
                "text-[13px] leading-snug",
                deadline.urgent ? "text-ember" : "text-pewter",
              )}
            >
              {deadline.text}
            </p>
            {opportunity.source_name ? (
              <p className="mt-2 text-[12px] text-smoke">via {opportunity.source_name}</p>
            ) : null}
            <Arrow className="ml-auto mt-4 text-ink group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </article>
  );
}
