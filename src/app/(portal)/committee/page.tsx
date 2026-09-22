import { ai, serviceHealth } from "@/lib/ai-api";
import { ApiError } from "@/lib/api";
import { EvaluationForm } from "./evaluation-form";
import { ReviewTable } from "./review-table";
import {
  Banner,
  EmptyState,
  PillLink,
  SectionLabel,
  TextArrowLink,
} from "@/components/ui";
import type { AppDocument, EvaluationRun } from "@/types/ai";

export const metadata = { title: "The Committee — GradPortal" };
export const dynamic = "force-dynamic";

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
    <div className="py-10">
      <SectionLabel>Admissions review</SectionLabel>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-2">
        <h1 className="heading-lg">The Committee</h1>
        <p className="max-w-[440px] text-[13px] leading-relaxed text-pewter">
          Your file is read against the rubric for the degree you are applying to,
          criterion by criterion. The same CV scores very differently for a
          master&rsquo;s and a PhD. The feedback is not flattering.
        </p>
      </div>

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
        <section className="mt-12 border-t border-ink/15 pt-10">
          <div className="mb-5 flex items-end justify-between gap-6">
            <div>
              <SectionLabel>History</SectionLabel>
              <h2 className="heading">Past reviews</h2>
            </div>
            <TextArrowLink href="/dossier">Manage your dossier</TextArrowLink>
          </div>

          <ReviewTable runs={runs} />
        </section>
      ) : null}
    </div>
  );
}
