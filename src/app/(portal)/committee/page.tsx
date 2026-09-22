import Link from "next/link";
import { ai, serviceHealth } from "@/lib/ai-api";
import { ApiError } from "@/lib/api";
import { EvaluationForm } from "./evaluation-form";
import { ScoreMeter } from "@/components/score-meter";
import {
  Banner,
  EmptyState,
  Hairline,
  PillLink,
  SectionLabel,
  Tag,
  TextArrowLink,
} from "@/components/ui";
import { formatRelative } from "@/lib/format";
import type { AppDocument, EvaluationRun } from "@/types/ai";

export const metadata = { title: "The Committee — GradPortal" };
export const dynamic = "force-dynamic";

const VERDICT_TONE: Record<string, "ember" | "outline"> = {
  competitive: "outline",
  borderline: "outline",
  "needs work": "ember",
  "not ready": "ember",
};

export default async function EvaluatePage() {
  const health = await serviceHealth();
  const evalHealth = health.evaluation;

  let documents: AppDocument[] = [];
  let runs: EvaluationRun[] = [];
  let loadError: string | null = null;

  try {
    const [docs, history] = await Promise.all([
      ai.documents().catch(() => ({ items: [], total: 0 })),
      ai.evaluations().catch(() => ({ items: [], total: 0 })),
    ]);
    documents = docs.items.filter((d) => d.status === "indexed");
    runs = history.items;
  } catch (error) {
    loadError = error instanceof ApiError ? error.message : "Could not load evaluations.";
  }

  const openrouterMissing = evalHealth?.checks?.openrouter?.startsWith("missing");

  return (
    <div className="py-12">
      <SectionLabel>Admissions review</SectionLabel>
      <h1 className="heading-lg mb-4">The Committee</h1>
      <p className="prose-column mb-10 text-[15px] text-pewter">
        Your documents are read the way a graduate admissions committee reads them —
        against the rubric for the degree you are applying to, criterion by criterion,
        then as a whole file. The same CV scores very differently for a master&rsquo;s
        and a PhD, because the two committees are asking different questions. The
        feedback is specific and it is not flattering.
      </p>

      {evalHealth === null ? (
        <div className="mb-8">
          <Banner tone="error">
            The evaluation service is not running. Start it with{" "}
            <code className="text-[12px]">uvicorn eval_service.main:app --port 8003</code>{" "}
            from the services directory.
          </Banner>
        </div>
      ) : openrouterMissing ? (
        <div className="mb-8">
          <Banner tone="warning">
            <strong>OPENROUTER_API_KEY is not set,</strong> so reviews cannot run. Add it
            to <code className="text-[12px]">services/.env</code> and restart
            eval-service.
          </Banner>
        </div>
      ) : null}

      {loadError ? (
        <div className="mb-8">
          <Banner tone="error">{loadError}</Banner>
        </div>
      ) : null}

      {documents.length === 0 ? (
        <EmptyState
          title="Nothing to review yet"
          body="Upload at least your CV and statement of purpose. Those two carry most of the weight in a committee's reading."
          action={<PillLink href="/dossier">Build your dossier</PillLink>}
        />
      ) : (
        <EvaluationForm documents={documents} />
      )}

      {runs.length > 0 ? (
        <section className="mt-20">
          <div className="mb-6 flex items-end justify-between gap-6">
            <div>
              <SectionLabel>History</SectionLabel>
              <h2 className="heading">Past reviews</h2>
            </div>
            <TextArrowLink href="/dossier">Manage your dossier</TextArrowLink>
          </div>

          <ul>
            {runs.map((run) => (
              <li key={run.id} className="hairline py-6 first:border-t-0 first:pt-0">
                <Link href={`/committee/${run.id}`} className="group block">
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Tag tone="outline">
                          {run.track === "phd" ? "PhD" : "Master's"}
                        </Tag>
                        {run.verdict ? (
                          <Tag tone={VERDICT_TONE[run.verdict] ?? "outline"}>
                            {run.verdict}
                          </Tag>
                        ) : null}
                        <span className="text-[12px] text-smoke">
                          {formatRelative(run.created_at)}
                        </span>
                      </div>
                      <p className="prose-column line-clamp-2 text-[15px] leading-relaxed text-ink transition-colors group-hover:text-ember">
                        {run.summary ?? run.error ?? "No summary."}
                      </p>
                    </div>
                    {run.overall_score !== null ? (
                      <div className="w-[150px] shrink-0">
                        <p className="text-right text-[36px] font-light leading-none tracking-[-0.72px] text-ink">
                          {Math.round(run.overall_score)}
                          <span className="text-[14px] text-smoke">/100</span>
                        </p>
                        <div className="mt-3">
                          <ScoreMeter value={run.overall_score} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
            <Hairline />
          </ul>
        </section>
      ) : null}
    </div>
  );
}
