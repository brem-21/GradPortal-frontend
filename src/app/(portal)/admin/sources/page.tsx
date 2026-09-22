import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { SourceControls, SourcesToolbar } from "./controls";
import { EmptyState, Hairline, SectionLabel, Tag, cx } from "@/components/ui";
import { formatRelative, titleCase } from "@/lib/format";

export const metadata = { title: "Sources — GradPortal" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  ok: "text-ink",
  partial: "text-ember",
  error: "text-ember",
  skipped: "text-smoke",
};

export default async function SourcesPage() {
  const me = await api.me();
  if (me.role !== "admin") redirect("/overview");

  const sources = await api.sources();
  const enabled = sources.filter((s) => s.enabled);

  return (
    <div className="py-12">
      <SectionLabel>Ingestion</SectionLabel>
      <h1 className="heading-lg mb-4">Sources</h1>
      <p className="prose-column mb-8 text-[15px] text-pewter">
        Each row is one place the agent crawls. Feeds and JSON endpoints are stable;
        HTML listings depend on selectors that break when a site is redesigned, so they
        ship disabled until you confirm them.
      </p>

      <div className="prose-column mb-10 rounded-card border border-mist px-4 py-[14px] text-[13px] leading-relaxed text-pewter">
        Verify a selector before enabling an HTML source:
        <br />
        <code className="mt-2 inline-block rounded-small bg-mist px-2 py-1 text-[12px] text-ink">
          python -m app.agent.probe --url &lt;list_url&gt; --selector &lt;item_selector&gt;
        </code>
      </div>

      <SourcesToolbar enabledCount={enabled.length} totalCount={sources.length} />

      {sources.length === 0 ? (
        <EmptyState
          title="No sources configured"
          body="Seed the starter catalogue to get feeds and scholarship portals in place, then add your own university pages."
        />
      ) : (
        <ul className="mt-10">
          {sources.map((source) => (
            <li key={source.id} className="hairline py-7 first:border-t-0 first:pt-0">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h2 className="text-[18px] text-ink">{source.name}</h2>
                    <Tag tone={source.enabled ? "outline" : "mist"}>
                      {source.enabled ? "Enabled" : "Disabled"}
                    </Tag>
                    {source.requires_credentials ? (
                      <Tag tone="ember">Needs credentials</Tag>
                    ) : null}
                  </div>

                  <p className="text-[12px] text-smoke">
                    {source.slug} · {source.adapter} · {titleCase(source.kind)}
                  </p>

                  {source.base_url ? (
                    <a
                      href={source.base_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-[12px] text-ember hover:underline"
                    >
                      {source.base_url}
                    </a>
                  ) : null}

                  <p className="mt-3 text-[13px]">
                    {source.last_run_at ? (
                      <>
                        <span className="text-smoke">Last run</span>{" "}
                        <span className="text-pewter">
                          {formatRelative(source.last_run_at)}
                        </span>
                        {source.last_run_status ? (
                          <>
                            {" · "}
                            <span
                              className={cx(
                                STATUS_TONE[source.last_run_status] ?? "text-pewter",
                              )}
                            >
                              {source.last_run_status}
                            </span>
                          </>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-smoke">Never run</span>
                    )}
                  </p>

                  {source.last_run_message ? (
                    <p className="prose-column mt-2 text-[12px] leading-relaxed text-pewter">
                      {source.last_run_message}
                    </p>
                  ) : null}
                </div>

                <SourceControls id={source.id} enabled={source.enabled} />
              </div>
            </li>
          ))}
          <Hairline />
        </ul>
      )}
    </div>
  );
}
