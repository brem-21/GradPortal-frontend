import Link from "next/link";
import { api } from "@/lib/api";
import { CommunityGallery } from "@/components/community-gallery";
import { OpportunityCard } from "@/components/opportunity-card";
import { RefreshButton } from "@/components/refresh-button";
import { SuccessStories } from "@/components/success-stories";
import { getSiteMedia, getSiteStories, resolveGallery } from "@/lib/site-content";
import {
  EmptyState,
  Hairline,
  PillLink,
  SectionLabel,
  StatTile,
  Tag,
  TextArrowLink,
} from "@/components/ui";
import { fieldLabel, typeLabel } from "@/lib/format";

export const metadata = { title: "Overview — GradPortal" };

export default async function OverviewPage() {
  const [media, stories] = await Promise.all([getSiteMedia(), getSiteStories()]);
  const [me, stats, freshness, matches, closing] = await Promise.all([
    api.me(),
    api.overview(),
    api.freshness().catch(() => null),
    api.opportunities({ match_my_preferences: true, sort: "relevance", page_size: 5 }),
    api.opportunities({
      sort: "deadline",
      page_size: 4,
      match_my_preferences: true,
      deadline_after: new Date().toISOString().slice(0, 10),
    }),
  ]);

  const firstName = me.full_name?.split(" ")[0] ?? "there";
  const noPreferences =
    (me.preference?.fields_of_study.length ?? 0) === 0 &&
    (me.preference?.opportunity_types.length ?? 0) === 0;

  return (
    <div className="py-12">
      <SectionLabel>Overview</SectionLabel>
      <h1 className="heading-lg prose-column mb-4">Good to see you, {firstName}.</h1>
      {freshness ? (
        <div className="mb-10">
          <RefreshButton
            lastRefreshedAt={freshness.last_refreshed_at}
            canRefresh={freshness.can_refresh}
            retryAfterSeconds={freshness.retry_after_seconds}
            everyHours={freshness.scheduled_every_hours}
          />
        </div>
      ) : (
        <div className="mb-10" />
      )}

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Matching your interests"
          value={stats.matching_opportunities}
          hint={`${stats.new_this_week} added this week`}
        />
        <StatTile
          label="Closing within 7 days"
          value={stats.closing_in_7_days}
          accent={stats.closing_in_7_days > 0}
          hint="Across your saved filters"
        />
        <StatTile
          label="On your list"
          value={stats.saved_count}
          hint={`${stats.applied_count} applied or further`}
        />
        <StatTile
          label="Emails sent"
          value={stats.emails_sent}
          hint="From your own mailbox"
        />
      </div>

      {!me.can_send_email_as_self ? (
        <div className="mt-6 rounded-card border border-ember/30 px-4 py-[14px] text-[13px]">
          Your mailbox is not connected, so you cannot email contacts yet. Sign out and
          sign back in with Google to grant send permission — emails then come from your
          own address and replies reach your inbox.
        </div>
      ) : null}

      {/* Matches */}
      <section className="mt-16">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <SectionLabel>Ranked for you</SectionLabel>
            <h2 className="heading">Best matches</h2>
          </div>
          <TextArrowLink href="/opportunities">See all openings</TextArrowLink>
        </div>

        {noPreferences ? (
          <EmptyState
            title="Tell us what you are after"
            body="Pick your opportunity types and fields, and this page fills with matches ranked by how well they fit."
            action={<PillLink href="/onboarding">Choose your interests</PillLink>}
          />
        ) : matches.items.length === 0 ? (
          <EmptyState
            title="Nothing matches yet"
            body="Your filters may be narrow, or the crawler has not found anything in these fields recently. Widening the countries or funding filter usually helps."
            action={<PillLink href="/profile">Adjust your preferences</PillLink>}
          />
        ) : (
          <div>
            {matches.items.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
            <Hairline />
          </div>
        )}
      </section>

      {/* Two-column feature row */}
      <section className="mt-16 grid gap-4 md:grid-cols-2">
        <article className="flex min-h-[300px] flex-col justify-between rounded-card bg-mist p-6">
          <div>
            <SectionLabel>Closing soon</SectionLabel>
            <h3 className="heading mb-5">Deadlines ahead</h3>
            {closing.items.length === 0 ? (
              <p className="text-[13px] text-pewter">
                Nothing with a near deadline in your filters right now.
              </p>
            ) : (
              <ul className="space-y-3">
                {closing.items.map((opportunity) => (
                  <li key={opportunity.id}>
                    <Link
                      href={`/opportunities/${opportunity.id}`}
                      className="group flex items-baseline justify-between gap-4"
                    >
                      <span className="line-clamp-1 text-[15px] text-ink group-hover:text-ember">
                        {opportunity.title}
                      </span>
                      <span className="shrink-0 text-[12px] text-pewter">
                        {opportunity.days_until_deadline !== null
                          ? `${opportunity.days_until_deadline}d`
                          : "—"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-8">
            <TextArrowLink href="/opportunities?sort=deadline">
              Sort everything by deadline
            </TextArrowLink>
          </div>
        </article>

        <article className="surface-tide flex min-h-[300px] flex-col justify-between rounded-card p-6">
          <div>
            <SectionLabel className="text-mist">Where you stand</SectionLabel>
            <h3 className="heading text-paper">Your feed, by the numbers</h3>
            <div className="mt-6 space-y-2">
              {Object.entries(stats.by_type).length === 0 ? (
                <p className="text-[13px] text-mist">
                  No breakdown yet — your filters match nothing.
                </p>
              ) : (
                Object.entries(stats.by_type)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div
                      key={type}
                      className="flex items-baseline justify-between border-b border-paper/15 pb-2 text-[13px]"
                    >
                      <span className="text-paper">{typeLabel(type)}</span>
                      <span className="text-mist">{count}</span>
                    </div>
                  ))
              )}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {Object.keys(stats.by_field).map((field) => (
              <Tag key={field} tone="paper">
                {fieldLabel(field)}
              </Tag>
            ))}
          </div>
        </article>
      </section>

      {/* Community */}
      <CommunityGallery
        photos={resolveGallery(media)}
        label="The community"
        title="Where this leads"
        blurb="Campus life across the programmes and funding bodies this portal tracks."
      />

      <SuccessStories stories={stories} />

      {/* Mentorship prompt */}
      <section className="mt-16 rounded-card border border-mist p-6">
        <SectionLabel>Mentorship</SectionLabel>
        <h3 className="heading prose-column mb-4">
          Someone in the directory has already applied where you are applying.
        </h3>
        <p className="prose-column mb-6 text-[15px] text-pewter">
          Mentors on the platform have been through admissions, funding and visa
          processes in these fields. Ask them what the listing does not say.
        </p>
        <TextArrowLink href="/mentors">Browse mentors</TextArrowLink>
      </section>
    </div>
  );
}
