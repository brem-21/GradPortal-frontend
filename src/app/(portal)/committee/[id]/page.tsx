import Link from "next/link";
import { notFound } from "next/navigation";
import { ai } from "@/lib/ai-api";
import { ApiError } from "@/lib/api";
import { FindingsTable } from "@/components/findings-table";
import { RichText } from "@/components/rich-text";
import { ScoreMeter } from "@/components/score-meter";
import { Banner, SectionLabel, Tag, TextArrowLink } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { kindLabel } from "@/lib/document-kinds";

export const dynamic = "force-dynamic";

export const metadata = { title: "Committee review — GradPortal" };

export default async function EvaluationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let run;
  try {
    run = await ai.evaluation(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const completed = run.assessments.filter((a) => a.status === "completed");
  const failed = run.assessments.filter((a) => a.status !== "completed");

  return (
    <div className="py-10">
      <Link
        href="/committee"
        className="mb-6 inline-block text-[13px] text-smoke transition-colors hover:text-ink"
      >
        ← All reviews
      </Link>

      <SectionLabel>
        {run.track === "phd" ? "Doctoral" : "Master's"} admissions review ·{" "}
        {formatDate(run.created_at)}
      </SectionLabel>

      {/* Verdict and score sit on one line. The old layout gave the number a
          62px display treatment that pushed the review itself off-screen. */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <h1 className="heading-lg">
          {run.verdict
            ? run.verdict.charAt(0).toUpperCase() + run.verdict.slice(1)
            : "Review"}
        </h1>
        {run.overall_score !== null ? (
          <div className="w-[240px]">
            <p className="text-right text-[34px] font-light leading-none tracking-[-0.8px] text-ink">
              {Math.round(run.overall_score)}
              <span className="text-[14px] text-smoke">/100</span>
            </p>
            <div className="mt-2">
              <ScoreMeter value={run.overall_score} />
            </div>
            {/* The score rates the documents submitted; the verdict rates the
                file as a whole. A strong CV in an incomplete file scores well
                and is still not ready, which looks contradictory unless said. */}
            <p className="mt-1.5 text-right text-[11px] leading-relaxed text-smoke">
              Average quality of what you submitted. The verdict also weighs
              what is missing.
            </p>
          </div>
        ) : null}
      </div>

      {run.status === "failed" ? (
        <div className="mb-8">
          <Banner tone="error">{run.error ?? "This review failed."}</Banner>
        </div>
      ) : null}

      {/* The narrative on the left, the to-do list on the right: they are read
          together, and stacking them cost a screen of scrolling on its own. */}
      <div className="mb-10 grid gap-x-12 gap-y-8 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-6">
          {run.summary ? (
            <RichText className="prose-column font-serif text-[16px] leading-[1.55]">
              {run.summary}
            </RichText>
          ) : null}

          {run.committee_note ? (
            <section className="rounded-card bg-mist p-5">
              <SectionLabel>What would be said in the room</SectionLabel>
              <RichText className="prose-column mt-1 text-[14px]">
                {run.committee_note}
              </RichText>
            </section>
          ) : null}
        </div>

        <div className="space-y-6">
          {run.priority_actions.length > 0 ? (
            <section>
              <SectionLabel>Do these first</SectionLabel>
              <ol className="mt-2">
                {run.priority_actions.map((action, index) => (
                  <li
                    key={action}
                    className="grid grid-cols-[28px_1fr] items-baseline gap-3 border-b border-mist py-3 last:border-b-0"
                  >
                    <span className="text-[12px] text-smoke">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[14px] leading-snug text-ink">{action}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {run.missing_documents.length > 0 ? (
            <section>
              <SectionLabel>Not submitted</SectionLabel>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {run.missing_documents.map((kind) => (
                  <Tag key={kind} tone="ember">
                    {kindLabel(kind)}
                  </Tag>
                ))}
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-pewter">
                A {run.track === "phd" ? "doctoral" : "master's"} committee expects
                these. Their absence is itself read as a signal.
              </p>
            </section>
          ) : null}
        </div>
      </div>

      <section className="border-t border-ink/15 pt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel>Document by document</SectionLabel>
            <h2 className="heading">The detailed read</h2>
          </div>
          <p className="text-[12px] text-smoke">
            Sorted by severity within each document.
          </p>
        </div>

        <FindingsTable assessments={completed} showEvidence />

        {failed.length > 0 ? (
          <div className="mt-6 space-y-3">
            {failed.map((assessment) => (
              <Banner key={assessment.id} tone="error">
                <strong>{assessment.document_title}:</strong>{" "}
                {assessment.error ?? "This document could not be reviewed."}
              </Banner>
            ))}
          </div>
        ) : null}
      </section>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
        <TextArrowLink href="/committee">Run another review</TextArrowLink>
        {run.model ? (
          <p className="max-w-[460px] text-[12px] leading-relaxed text-smoke">
            Reviewed with {run.model}. This is an informed simulation of a committee
            reading, not a decision — treat it as one experienced reader&rsquo;s
            opinion.
          </p>
        ) : null}
      </div>
    </div>
  );
}
