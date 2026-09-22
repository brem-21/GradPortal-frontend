import {
  DEGREE_LABELS,
  FIELD_LABELS,
  FUNDING_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
} from "./format";

function toOptions<T extends string>(map: Record<T, string>) {
  return (Object.entries(map) as [T, string][]).map(([value, label]) => ({
    value,
    label,
  }));
}

export const FIELD_OPTIONS = toOptions(FIELD_LABELS);
export const TYPE_OPTIONS = toOptions(TYPE_LABELS);
export const DEGREE_OPTIONS = toOptions(DEGREE_LABELS);
export const FUNDING_OPTIONS = toOptions(FUNDING_LABELS).filter(
  (o) => o.value !== "unknown",
);
export const APPLICATION_STATUS_OPTIONS = toOptions(STATUS_LABELS);

export const DIGEST_OPTIONS = [
  { value: "instant", label: "As it happens" },
  { value: "daily", label: "Daily digest" },
  { value: "weekly", label: "Weekly digest" },
  { value: "off", label: "No emails" },
];

/** Common destinations. The country filter also accepts anything the crawl found. */
export const COUNTRY_SUGGESTIONS = [
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "Netherlands",
  "Sweden",
  "Switzerland",
  "Ireland",
  "Australia",
  "China",
  "Japan",
  "South Korea",
  "Singapore",
  "United Arab Emirates",
  "South Africa",
  "Ghana",
  "Kenya",
  "Nigeria",
  "Rwanda",
];

/** Region groups. Mirrors app/core/regions.py on the backend. */
export const REGION_OPTIONS = [
  { value: "europe", label: "Europe" },
  { value: "united_kingdom", label: "United Kingdom" },
  { value: "united_states", label: "United States" },
  { value: "canada", label: "Canada" },
  { value: "australia_nz", label: "Australia & NZ" },
  { value: "asia", label: "Asia" },
  { value: "africa", label: "Africa" },
  { value: "middle_east", label: "Middle East" },
];
