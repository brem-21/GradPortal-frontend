import type {
  ApplicationStatus,
  DegreeLevel,
  FieldOfStudy,
  FundingType,
  OpportunityType,
} from "@/types/api";

export const FIELD_LABELS: Record<FieldOfStudy, string> = {
  computer_science: "Computer Science",
  artificial_intelligence: "Artificial Intelligence",
  data_science: "Data Science",
  data_engineering: "Data Engineering",
  data_analytics: "Data Analytics",
};

export const TYPE_LABELS: Record<OpportunityType, string> = {
  graduate_program: "Graduate programme",
  scholarship: "Scholarship",
  fellowship: "Fellowship",
  assistantship: "Assistantship",
  research_position: "Research position",
  internship: "Internship",
  job: "Job",
};

export const DEGREE_LABELS: Record<DegreeLevel, string> = {
  masters: "Master's",
  phd: "PhD",
  postdoc: "Postdoc",
  certificate: "Certificate",
};

export const FUNDING_LABELS: Record<FundingType, string> = {
  fully_funded: "Fully funded",
  partial: "Partially funded",
  tuition_waiver: "Tuition waiver",
  stipend_only: "Stipend only",
  unfunded: "Unfunded",
  unknown: "Funding unspecified",
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  in_progress: "In progress",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
};

export function titleCase(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function fieldLabel(value: string): string {
  return FIELD_LABELS[value as FieldOfStudy] ?? titleCase(value);
}

export function typeLabel(value: string): string {
  return TYPE_LABELS[value as OpportunityType] ?? titleCase(value);
}

export function degreeLabel(value: string): string {
  return DEGREE_LABELS[value as DegreeLevel] ?? titleCase(value);
}

export function fundingLabel(value: string): string {
  return FUNDING_LABELS[value as FundingType] ?? titleCase(value);
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatRelative(value: string): string {
  const then = new Date(value).getTime();
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

/** Deadline phrasing that stays honest when the date is missing or rolling. */
export function deadlineLabel(
  deadline: string | null,
  deadlineText: string | null,
  daysLeft: number | null,
): { text: string; urgent: boolean } {
  if (!deadline) {
    return { text: deadlineText || "No stated deadline", urgent: false };
  }
  if (daysLeft === null) return { text: formatDate(deadline), urgent: false };
  if (daysLeft < 0) return { text: `Closed ${formatDate(deadline)}`, urgent: false };
  if (daysLeft === 0) return { text: "Closes today", urgent: true };
  if (daysLeft === 1) return { text: "Closes tomorrow", urgent: true };
  if (daysLeft <= 14) return { text: `${daysLeft} days left`, urgent: daysLeft <= 7 };
  return { text: formatDate(deadline), urgent: false };
}
