import Link from "next/link";
import { api } from "@/lib/api";
import { OpportunityCard } from "@/components/opportunity-card";
import { EmptyState, Hairline, PillLink, SectionLabel, cx } from "@/components/ui";
import { STATUS_LABELS } from "@/lib/format";
import type { ApplicationStatus } from "@/types/api";

export const metadata = { title: "Shortlist — GradPortal" };
export const dynamic = "force-dynamic";

const TABS: (ApplicationStatus | "all")[] = [
  "all",
  "saved",
  "in_progress",
  "applied",
  "interview",
  "offer",
];

export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = (status ?? "all") as ApplicationStatus | "all";

  const results = await api.saved({
    saved_status: active === "all" ? undefined : active,
    page_size: 50,
  });

  return (
    <div className="py-12">
      <SectionLabel>Application tracker</SectionLabel>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="heading-lg">Shortlist</h1>
        <p className="text-[13px] text-pewter">
          {results.total} {results.total === 1 ? "entry" : "entries"}
        </p>
      </div>

      <div className="mb-10 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab}
            href={tab === "all" ? "/shortlist" : `/saved?status=${tab}`}
            className={cx(
              "rounded-pill px-[14px] py-[8px] text-[12px] font-medium leading-none transition-colors duration-200",
              active === tab
                ? "bg-char text-paper"
                : "text-pewter ring-1 ring-inset ring-mist hover:ring-smoke",
            )}
          >
            {tab === "all" ? "Everything" : STATUS_LABELS[tab]}
          </Link>
        ))}
      </div>

      {results.items.length === 0 ? (
        <EmptyState
          title={active === "all" ? "Nothing saved yet" : "Nothing at this stage"}
          body="Save an opportunity from its page and it appears here, where you can move it through saved, applied, interview and offer."
          action={<PillLink href="/opportunities">Browse openings</PillLink>}
        />
      ) : (
        <div>
          {results.items.map((entry) => (
            <div key={entry.id}>
              <OpportunityCard opportunity={entry.opportunity} />
              {entry.notes ? (
                <p className="-mt-3 pb-5 text-[13px] italic text-pewter">
                  Note: {entry.notes}
                </p>
              ) : null}
            </div>
          ))}
          <Hairline />
        </div>
      )}
    </div>
  );
}
