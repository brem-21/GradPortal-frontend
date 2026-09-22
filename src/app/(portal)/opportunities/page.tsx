import Link from "next/link";
import { api } from "@/lib/api";
import { Filters } from "./filters";
import { OpportunityCard } from "@/components/opportunity-card";
import { RefreshButton } from "@/components/refresh-button";
import { EmptyState, Hairline, PillLink, SectionLabel, cx } from "@/components/ui";

export const metadata = { title: "Opportunities — GradPortal" };

type Search = Record<string, string | string[] | undefined>;

function list(search: Search, key: string): string[] {
  const value = search[key];
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function one(search: Search, key: string): string | undefined {
  const value = search[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const page = Number(one(search, "page") ?? 1);

  const [facets, freshness, results] = await Promise.all([
    api.facets(),
    api.freshness().catch(() => null),
    api.opportunities({
      q: one(search, "q"),
      sort: one(search, "sort") ?? "deadline",
      opportunity_types: list(search, "opportunity_types"),
      regions: list(search, "regions"),
      fields_of_study: list(search, "fields_of_study"),
      degree_levels: list(search, "degree_levels"),
      countries: list(search, "countries"),
      funding_types: list(search, "funding_types"),
      has_contact: one(search, "has_contact") === "true" ? true : undefined,
      open_to_international:
        one(search, "open_to_international") === "true" ? true : undefined,
      include_expired: one(search, "include_expired") === "true",
      page,
      page_size: 20,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(results.total / results.page_size));

  function pageHref(target: number): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) {
      if (key === "page" || value === undefined) continue;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
      else params.append(key, value);
    }
    params.set("page", String(target));
    return `/opportunities?${params.toString()}`;
  }

  return (
    <div className="py-12">
      <SectionLabel>Browse</SectionLabel>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h1 className="heading-lg">Opportunities</h1>
        <div className="text-right">
          <p className="text-[13px] text-pewter">
            {results.total} open{" "}
            {results.total === 1 ? "opportunity" : "opportunities"}
          </p>
          {freshness ? (
            <div className="mt-2">
              <RefreshButton
                lastRefreshedAt={freshness.last_refreshed_at}
                canRefresh={freshness.can_refresh}
                retryAfterSeconds={freshness.retry_after_seconds}
                everyHours={freshness.scheduled_every_hours}
              />
            </div>
          ) : null}
        </div>
      </div>

      <Filters facets={facets} />

      {results.items.length === 0 ? (
        <EmptyState
          title="Nothing matches those filters"
          body="Try clearing a filter, widening the countries, or including closed listings to see what has recently passed."
          action={<PillLink href="/opportunities">Clear all filters</PillLink>}
        />
      ) : (
        <>
          <div>
            {results.items.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
            <Hairline />
          </div>

          {totalPages > 1 ? (
            <nav className="mt-10 flex items-center justify-between">
              <Link
                href={pageHref(page - 1)}
                aria-disabled={page <= 1}
                className={cx(
                  "text-[13px]",
                  page <= 1
                    ? "pointer-events-none text-mist"
                    : "text-ink hover:text-ember",
                )}
              >
                ← Previous
              </Link>
              <span className="text-[12px] text-smoke">
                Page {page} of {totalPages}
              </span>
              <Link
                href={pageHref(page + 1)}
                aria-disabled={page >= totalPages}
                className={cx(
                  "text-[13px]",
                  page >= totalPages
                    ? "pointer-events-none text-mist"
                    : "text-ink hover:text-ember",
                )}
              >
                Next →
              </Link>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
