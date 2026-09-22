import Link from "next/link";
import { Tag, cx } from "./ui";
import { deadlineLabel, fieldLabel, typeLabel } from "@/lib/format";
import type { Opportunity } from "@/types/api";

/**
 * Openings as a scannable table.
 *
 * A list of cards reads one opening at a time; a table lets you compare
 * deadlines and countries down a column, which is how you actually decide what
 * to apply to. The title is the link — the whole row is not clickable, so the
 * contact and source cells stay selectable.
 *
 * Below `md` the table becomes a stacked list: five columns in 380px is not a
 * table, it is a scroll bar.
 */
export function OpportunityTable({ items }: { items: Opportunity[] }) {
  return (
    <div className="hidden md:block">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          Graduate openings, with deadline, location and source
        </caption>
        <thead>
          <tr className="border-b border-ink/15">
            {["Opening", "Type", "Location", "Deadline", "Source"].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="section-label py-3 pr-5 align-bottom font-normal last:pr-0"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((opportunity) => {
            const deadline = deadlineLabel(
              opportunity.application_deadline,
              opportunity.deadline_text,
              opportunity.days_until_deadline,
            );
            const hasContact = opportunity.contacts.some((contact) => contact.email);

            return (
              <tr
                key={opportunity.id}
                className="group border-b border-mist align-top transition-colors hover:bg-mist/30"
              >
                <td className="py-4 pr-5">
                  <Link
                    href={`/opportunities/${opportunity.id}`}
                    className="text-[15px] leading-snug text-ink transition-colors group-hover:text-ember hover:underline"
                  >
                    {opportunity.title}
                  </Link>
                  {opportunity.organization ? (
                    <p className="mt-1 text-[12px] text-pewter">
                      {opportunity.organization}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {opportunity.fields_of_study.slice(0, 2).map((field) => (
                      <Tag key={field}>{fieldLabel(field)}</Tag>
                    ))}
                    {hasContact ? <Tag tone="ember">Contact</Tag> : null}
                    {opportunity.is_saved ? <Tag tone="outline">Saved</Tag> : null}
                  </div>
                </td>
                <td className="py-4 pr-5 text-[13px] text-pewter">
                  {typeLabel(opportunity.opportunity_type)}
                </td>
                <td className="py-4 pr-5 text-[13px] text-pewter">
                  {opportunity.is_remote ? "Remote" : (opportunity.country ?? "—")}
                </td>
                <td
                  className={cx(
                    "py-4 pr-5 text-[13px]",
                    deadline.urgent ? "text-ember" : "text-pewter",
                  )}
                >
                  {deadline.text}
                </td>
                <td className="py-4 text-[12px] text-smoke">
                  {opportunity.source_name ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
