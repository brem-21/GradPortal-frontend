"use client";

import { Fragment, useEffect, useState } from "react";
import { FindingsTable } from "@/components/findings-table";
import { ScoreMeter } from "@/components/score-meter";
import { Tag, TextArrowLink, cx } from "@/components/ui";
import { fetchEvaluationAction } from "@/lib/ai-actions";
import { formatRelative } from "@/lib/format";
import type { EvaluationDetail, EvaluationRun } from "@/types/ai";

const VERDICT_TONE: Record<string, "ember" | "outline"> = {
  competitive: "outline",
  borderline: "outline",
  "needs work": "ember",
  "not ready": "ember",
};

/**
 * Past reviews as a table whose rows open in place.
 *
 * Scores and verdicts are only useful next to each other — the point of the
 * history is watching the number move — and a full-page navigation to read one
 * summary loses that comparison. The title expands the row; the full review,
 * with every criterion, stays a click away inside it.
 */
export function ReviewTable({ runs }: { runs: EvaluationRun[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">
        Past admissions reviews, newest first. Select a review to expand it.
      </caption>
      <thead>
        <tr className="border-b border-ink/15">
          {["Review", "Track", "Verdict", "Score", "When"].map((heading) => (
            <th
              key={heading}
              scope="col"
              className={cx(
                "section-label py-3 pr-5 align-bottom font-normal last:pr-0",
                heading === "Score" && "w-[120px]",
                (heading === "Track" || heading === "When") && "hidden sm:table-cell",
              )}
            >
              {heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {runs.map((run) => {
          const isOpen = expanded === run.id;
          const title = run.summary ?? run.error ?? "No summary.";

          return (
            <Fragment key={run.id}>
              <tr
                className={cx(
                  "border-b align-top transition-colors",
                  isOpen ? "border-transparent bg-mist/30" : "border-mist hover:bg-mist/20",
                )}
              >
                <td className="py-4 pr-5">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : run.id)}
                    aria-expanded={isOpen}
                    aria-controls={`review-${run.id}`}
                    className="flex w-full items-start gap-2 text-left"
                  >
                    <span
                      aria-hidden="true"
                      className={cx(
                        "mt-[3px] shrink-0 text-[11px] text-smoke transition-transform duration-200",
                        isOpen && "rotate-90",
                      )}
                    >
                      ▶
                    </span>
                    <span
                      className={cx(
                        "text-[14px] leading-snug text-ink transition-colors hover:text-ember",
                        !isOpen && "line-clamp-2",
                      )}
                    >
                      {title}
                    </span>
                  </button>
                </td>
                <td className="hidden py-4 pr-5 text-[13px] text-pewter sm:table-cell">
                  {run.track === "phd" ? "PhD" : "Master's"}
                </td>
                <td className="py-4 pr-5">
                  {run.verdict ? (
                    <Tag tone={VERDICT_TONE[run.verdict] ?? "outline"}>{run.verdict}</Tag>
                  ) : (
                    <span className="text-[13px] text-smoke">—</span>
                  )}
                </td>
                <td className="py-4 pr-5">
                  {run.overall_score !== null ? (
                    <>
                      <p className="text-[20px] font-light leading-none tracking-[-0.4px] text-ink">
                        {Math.round(run.overall_score)}
                        <span className="text-[12px] text-smoke">/100</span>
                      </p>
                      <div className="mt-2">
                        <ScoreMeter value={run.overall_score} />
                      </div>
                    </>
                  ) : (
                    <span className="text-[13px] text-smoke">—</span>
                  )}
                </td>
                <td className="hidden py-4 text-[12px] text-smoke sm:table-cell">
                  {formatRelative(run.created_at)}
                </td>
              </tr>

              {isOpen ? (
                <tr className="border-b border-mist bg-mist/30">
                  <td id={`review-${run.id}`} colSpan={5} className="px-2 pb-6 pt-0">
                    <ExpandedReview run={run} />
                  </td>
                </tr>
              ) : null}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}


/**
 * The expanded row: every criterion the committee scored, grouped under the
 * document it was scored against.
 *
 * Section header rows rather than separate tables, so the criterion and score
 * columns stay aligned down the whole review — comparing a weak criterion in
 * the CV against a strong one in the SOP is the reason to look at this at all.
 */
function ExpandedReview({ run }: { run: EvaluationRun }) {
  const [detail, setDetail] = useState<EvaluationDetail | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchEvaluationAction(run.id).then((result) => {
      if (cancelled) return;
      if (result) setDetail(result);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [run.id]);

  return (
    <div className="animate-fade-up space-y-5 pl-5">
      {run.committee_note ? (
        <p className="prose-column text-[14px] leading-relaxed text-pewter">
          {run.committee_note}
        </p>
      ) : null}

      {run.priority_actions.length > 0 ? (
        <div>
          <p className="section-label mb-2">Do these first</p>
          <ol className="prose-column space-y-1.5">
            {run.priority_actions.map((action, index) => (
              <li
                key={action}
                className="flex gap-2.5 text-[14px] leading-relaxed text-ink"
              >
                <span className="shrink-0 text-smoke">{index + 1}.</span>
                {action}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {run.missing_documents.length > 0 ? (
        <div>
          <p className="section-label mb-2">Still missing</p>
          <div className="flex flex-wrap gap-1.5">
            {run.missing_documents.map((document) => (
              <Tag key={document} tone="ember">
                {document}
              </Tag>
            ))}
          </div>
        </div>
      ) : null}

      {detail === null && !failed ? (
        <p className="py-3 text-[13px] text-smoke">Loading the criteria…</p>
      ) : failed ? (
        <p className="py-3 text-[13px] text-smoke">
          Could not load the criteria for this review.
        </p>
      ) : (
        <div className="max-w-[900px]">
          <FindingsTable assessments={detail?.assessments ?? []} />
        </div>
      )}

      <TextArrowLink href={`/committee/${run.id}`}>
        Read the full review
      </TextArrowLink>
    </div>
  );
}
