import { Tag, cx } from "./ui";
import { kindLabel } from "@/lib/document-kinds";
import type { Assessment, Severity } from "@/types/ai";

const SEVERITY_TONE: Record<Severity, string> = {
  critical: "text-ember",
  major: "text-ember",
  minor: "text-pewter",
  strength: "text-ink",
};

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  major: 1,
  minor: 2,
  strength: 3,
};

/**
 * Every criterion a review scored, grouped under the document it was scored
 * against.
 *
 * One table with section header rows rather than a section per document: the
 * criterion and score columns stay aligned down the whole review, so a weak
 * criterion in the CV can be read against a strong one in the statement. The
 * stacked cards this replaced ran to several screens for the same content.
 */
export function FindingsTable({
  assessments,
  showEvidence = false,
}: {
  assessments: Assessment[];
  /** The full review page has room to quote the line a finding is about. */
  showEvidence?: boolean;
}) {
  const scored = assessments.filter((assessment) => assessment.findings.length > 0);
  if (scored.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-card border border-mist bg-paper">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          Every criterion scored in this review, grouped by document
        </caption>
        <thead>
          <tr className="border-b border-mist">
            <th scope="col" className="section-label w-[30%] px-4 py-2.5 font-normal">
              Criterion
            </th>
            <th scope="col" className="section-label w-[70px] px-2 py-2.5 font-normal">
              Score
            </th>
            <th scope="col" className="section-label px-4 py-2.5 font-normal">
              What the committee said
            </th>
          </tr>
        </thead>

        {scored.map((assessment) => (
          <tbody key={assessment.id}>
            <tr>
              <th
                scope="colgroup"
                colSpan={3}
                className="border-y border-mist bg-mist/50 px-4 py-2 text-left font-normal"
              >
                <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-[13px] text-ink">
                    {assessment.document_title}
                  </span>
                  <Tag tone="outline">{kindLabel(assessment.document_kind)}</Tag>
                  <span className="ml-auto text-[13px] text-pewter">
                    {Math.round(assessment.score)}
                    <span className="text-smoke">/100</span>
                  </span>
                </span>
              </th>
            </tr>

            {[...assessment.findings]
              .sort(
                (a, b) =>
                  SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
                  b.weight - a.weight,
              )
              .map((finding) => (
                <tr
                  key={finding.id}
                  className="border-b border-mist align-top last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <p className="text-[13px] leading-snug text-ink">
                      {finding.criterion_label}
                    </p>
                    <p
                      className={cx(
                        "mt-0.5 text-[11px] uppercase tracking-wide",
                        SEVERITY_TONE[finding.severity] ?? "text-pewter",
                      )}
                    >
                      {finding.severity}
                      <span className="text-smoke">
                        {" "}
                        · {(finding.weight * 100).toFixed(0)}%
                      </span>
                    </p>
                  </td>
                  <td className="px-2 py-3 text-[13px] text-pewter">
                    {finding.score.toFixed(1)}
                    <span className="text-smoke">/5</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[13px] leading-snug text-ink">{finding.title}</p>
                    {showEvidence && finding.evidence ? (
                      <p className="mt-1.5 border-l border-mist pl-3 font-serif text-[13px] leading-[1.5] text-pewter">
                        &ldquo;{finding.evidence}&rdquo;
                      </p>
                    ) : null}
                    {finding.suggestion ? (
                      <p className="mt-1.5 text-[12px] leading-relaxed text-pewter">
                        <span className="text-smoke">Do this: </span>
                        {finding.suggestion}
                      </p>
                    ) : null}
                  </td>
                </tr>
              ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
