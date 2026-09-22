import Link from "next/link";
import { notFound } from "next/navigation";
import { ai } from "@/lib/ai-api";
import { ApiError } from "@/lib/api";
import { ScoreMeter } from "@/components/score-meter";
import { Banner, Hairline, SectionLabel, Tag, TextArrowLink, cx } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { kindLabel } from "@/lib/document-kinds";
import type { Finding, Severity } from "@/types/ai";

export const dynamic = "force-dynamic";

export const metadata = { title: "Review — GradPortal" };

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  major: 1,
  minor: 2,
  strength: 3,
};

const SEVERITY_COPY: Record<Severity, { label: string; tone: string; border: string }> = {
  critical: {
    label: "Critical",
    tone: "text-ember",
    border: "border-l-2 border-l-ember pl-4",
  },
  major: { label: "Major", tone: "text-ember", border: "border-l-2 border-l-ember/50 pl-4" },
  minor: { label: "Minor", tone: "text-pewter", border: "border-l-2 border-l-mist pl-4" },
  strength: {
    label: "Strength",
    tone: "text-pewter",
    border: "border-l-2 border-l-ink pl-4",
  },
};

function FindingCard({ finding }: { finding: Finding }) {
  const severity = SEVERITY_COPY[finding.severity] ?? SEVERITY_COPY.minor;
  return (
    <li className={cx("py-5", severity.border)}>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
        <span className="flex items-center gap-2">
          <span className={cx("text-[11px] uppercase tracking-wide", severity.tone)}>
            {severity.label}
          </span>
          <span className="text-[12px] text-smoke">{finding.criterion_label}</span>
        </span>
        <span className="text-[12px] text-pewter">
          {finding.score.toFixed(1)}
          <span className="text-smoke">/5 · weight {(finding.weight * 100).toFixed(0)}%</span>
        </span>
      </div>

      <p className="text-[18px] leading-snug text-ink">{finding.title}</p>
      {finding.detail ? (
        <p className="prose-column mt-2 text-[15px] leading-[1.5] text-pewter">
          {finding.detail}
        </p>
      ) : null}

      {finding.evidence ? (
        <blockquote className="prose-column mt-3 border-l border-mist pl-4 font-serif text-[15px] leading-[1.5] text-ink">
          “{finding.evidence}”
        </blockquote>
      ) : null}

      {finding.suggestion ? (
        <p className="prose-column mt-3 text-[13px] leading-relaxed text-ink">
          <span className="text-smoke">Do this: </span>
          {finding.suggestion}
        </p>
      ) : null}
    </li>
  );
}

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
    <div className="py-12">
      <Link
        href="/evaluate"
        className="mb-8 inline-block text-[13px] text-smoke transition-colors hover:text-ink"
      >
        ← All reviews
      </Link>

      <SectionLabel>
        {run.track === "phd" ? "Doctoral" : "Master's"} admissions review ·{" "}
        {formatDate(run.created_at)}
      </SectionLabel>

      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <h1 className="heading-lg">
          {run.verdict
            ? run.verdict.charAt(0).toUpperCase() + run.verdict.slice(1)
            : "Review"}
        </h1>
        {run.overall_score !== null ? (
          <div className="w-[220px]">
            <p className="text-right text-[62px] font-light leading-none tracking-[-1.55px] text-ink">
              {Math.round(run.overall_score)}
              <span className="text-[18px] text-smoke">/100</span>
            </p>
            <div className="mt-3">
              <ScoreMeter value={run.overall_score} />
            </div>
          </div>
        ) : null}
      </div>

      {run.status === "failed" ? (
        <div className="mb-8">
          <Banner tone="error">{run.error ?? "This review failed."}</Banner>
        </div>
      ) : null}

      {run.summary ? (
        <section className="mb-10">
          <p className="prose-column font-serif text-[18px] leading-[1.5] text-ink">
            {run.summary}
          </p>
        </section>
      ) : null}

      {run.committee_note ? (
        <section className="mb-10 rounded-card bg-mist p-6">
          <SectionLabel>What would actually be said in the room</SectionLabel>
          <p className="prose-column text-[15px] leading-[1.5] text-ink">
            {run.committee_note}
          </p>
        </section>
      ) : null}

      {run.priority_actions.length > 0 ? (
        <section className="mb-10">
          <SectionLabel>Do these first</SectionLabel>
          <h2 className="heading mb-5">Priority actions</h2>
          <ol className="space-y-0">
            {run.priority_actions.map((action, index) => (
              <li
                key={index}
                className="hairline grid grid-cols-[42px_1fr] items-baseline gap-4 py-5"
              >
                <span className="text-[12px] text-smoke">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[18px] leading-snug text-ink">{action}</span>
              </li>
            ))}
            <Hairline />
          </ol>
        </section>
      ) : null}

      {run.missing_documents.length > 0 ? (
        <section className="mb-10">
          <SectionLabel>Not submitted</SectionLabel>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {run.missing_documents.map((kind) => (
              <Tag key={kind} tone="ember">
                {kindLabel(kind)}
              </Tag>
            ))}
          </div>
          <p className="prose-column mt-3 text-[13px] text-pewter">
            A {run.track === "phd" ? "doctoral" : "master's"} committee expects these.
            Their absence is itself read as a signal.
          </p>
        </section>
      ) : null}

      <Hairline />

      <section className="mt-10">
        <SectionLabel>Document by document</SectionLabel>
        <h2 className="heading mb-8">The detailed read</h2>

        <div className="space-y-14">
          {completed.map((assessment) => {
            const findings = [...assessment.findings].sort(
              (a, b) =>
                SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
                b.weight - a.weight,
            );
            return (
              <article key={assessment.id}>
                <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="text-[22px] font-light tracking-[-0.44px] text-ink">
                        {assessment.document_title}
                      </h3>
                      <Tag tone="outline">{kindLabel(assessment.document_kind)}</Tag>
                    </div>
                    <p className="text-[12px] text-smoke">{assessment.rubric_label}</p>
                  </div>
                  <div className="w-[160px] shrink-0">
                    <p className="text-right text-[28px] font-light leading-none tracking-[-0.6px] text-ink">
                      {Math.round(assessment.score)}
                      <span className="text-[13px] text-smoke">/100</span>
                    </p>
                    <div className="mt-2">
                      <ScoreMeter value={assessment.score} />
                    </div>
                  </div>
                </div>

                {assessment.summary ? (
                  <p className="prose-column mb-6 text-[15px] leading-[1.5] text-pewter">
                    {assessment.summary}
                  </p>
                ) : null}

                <ul className="space-y-1">
                  {findings.map((finding) => (
                    <FindingCard key={finding.id} finding={finding} />
                  ))}
                </ul>
              </article>
            );
          })}

          {failed.map((assessment) => (
            <article key={assessment.id}>
              <h3 className="mb-2 text-[22px] font-light tracking-[-0.44px] text-ink">
                {assessment.document_title}
              </h3>
              <Banner tone="error">
                {assessment.error ?? "This document could not be reviewed."}
              </Banner>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-14 flex flex-wrap items-center gap-6">
        <TextArrowLink href="/evaluate">Run another review</TextArrowLink>
        <TextArrowLink href="/assistant">Ask the assistant about this</TextArrowLink>
      </div>

      {run.model ? (
        <p className="mt-8 text-[12px] text-smoke">
          Reviewed with {run.model}. This is an informed simulation of a committee
          reading, not a decision — treat it as one experienced reader&rsquo;s opinion.
        </p>
      ) : null}
    </div>
  );
}
