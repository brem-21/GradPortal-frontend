import type { DocumentKind } from "@/types/ai";

export const KIND_LABELS: Record<DocumentKind, string> = {
  cv: "CV / Résumé",
  sop: "Statement of purpose",
  motivation_letter: "Motivation letter",
  recommendation: "Recommendation letter",
  transcript: "Transcript",
  research_proposal: "Research proposal",
  other: "Other",
};

export const KIND_HINTS: Record<DocumentKind, string> = {
  cv: "Judged on technical depth and quantified impact for a master's; on research output for a PhD.",
  sop: "The document that decides most files. Judged on goal clarity, programme fit and evidence.",
  motivation_letter: "Shorter and more personal than an SOP. Judged on authenticity and fit.",
  recommendation: "Judged on the recommender's credibility and how specific their evidence is.",
  transcript: "Checked for prerequisite coverage, grade trajectory and course rigour.",
  research_proposal: "Mainly a PhD document. Judged on novelty, method and feasibility.",
  other: "Anything else. Read against general application criteria.",
};

export const KIND_OPTIONS = (Object.keys(KIND_LABELS) as DocumentKind[]).map((value) => ({
  value,
  label: KIND_LABELS[value],
}));

export function kindLabel(kind: string): string {
  return KIND_LABELS[kind as DocumentKind] ?? kind.replace(/_/g, " ");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
