export type UserRole = "student" | "mentor" | "admin";

export type OpportunityType =
  | "graduate_program"
  | "scholarship"
  | "fellowship"
  | "assistantship"
  | "research_position"
  | "internship"
  | "job";

export type FieldOfStudy =
  | "computer_science"
  | "artificial_intelligence"
  | "data_science"
  | "data_engineering"
  | "data_analytics";

export type DegreeLevel = "masters" | "phd" | "postdoc" | "certificate";

export type FundingType =
  | "fully_funded"
  | "partial"
  | "tuition_waiver"
  | "stipend_only"
  | "unfunded"
  | "unknown";

export type OpportunityStatus = "pending_review" | "published" | "rejected" | "expired";

export type ApplicationStatus =
  | "saved"
  | "in_progress"
  | "applied"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

export type MentorshipStatus = "pending" | "accepted" | "declined" | "completed";

export type DigestFrequency = "instant" | "daily" | "weekly" | "off";

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface Contact {
  id: string;
  name: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  source_url: string | null;
  confidence: number;
  is_primary: boolean;
  verified: boolean;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  summary: string | null;
  opportunity_type: OpportunityType;
  fields_of_study: FieldOfStudy[];
  degree_levels: DegreeLevel[];
  organization: string | null;
  department: string | null;
  location: string | null;
  country: string | null;
  is_remote: boolean;
  funding_type: FundingType;
  funding_amount: string | null;
  open_to_international: boolean | null;
  application_deadline: string | null;
  deadline_text: string | null;
  posted_at: string | null;
  url: string;
  apply_url: string | null;
  source_name: string | null;
  status: OpportunityStatus;
  created_at: string;
  contacts: Contact[];
  is_saved: boolean;
  saved_status: ApplicationStatus | null;
  days_until_deadline: number | null;
}

export interface SavedOpportunity {
  id: string;
  status: ApplicationStatus;
  notes: string | null;
  created_at: string;
  opportunity: Opportunity;
}

export interface Profile {
  id: string;
  user_id: string;
  headline: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
  current_institution: string | null;
  current_title: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;
  cv_url: string | null;
  target_degree_level: string | null;
  target_intake: string | null;
  fields_of_study: string[];
  gpa: string | null;
  test_scores: string | null;
  is_mentor: boolean;
  mentor_is_accepting: boolean;
  years_experience: number | null;
  expertise: string[];
  mentor_bio: string | null;
  updated_at: string;
}

export interface Preference {
  id: string;
  user_id: string;
  opportunity_types: OpportunityType[];
  fields_of_study: FieldOfStudy[];
  degree_levels: DegreeLevel[];
  countries: string[];
  regions: string[];
  funding_types: FundingType[];
  email_digest: DigestFrequency;
  email_notifications_enabled: boolean;
  deadline_reminder_days: number[];
}

export interface Me {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  onboarding_completed: boolean;
  created_at: string;
  profile: Profile | null;
  preference: Preference | null;
  can_send_email_as_self: boolean;
  unread_notifications: number;
}

export interface MentorCard {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  country: string | null;
  current_institution: string | null;
  current_title: string | null;
  years_experience: number | null;
  expertise: string[];
  mentor_bio: string | null;
  linkedin_url: string | null;
  mentor_is_accepting: boolean;
}

export interface OverviewStats {
  matching_opportunities: number;
  new_this_week: number;
  closing_in_7_days: number;
  saved_count: number;
  applied_count: number;
  unread_notifications: number;
  emails_sent: number;
  by_type: Record<string, number>;
  by_field: Record<string, number>;
}

export interface OutreachDraft {
  to_email: string | null;
  to_name: string | null;
  subject: string;
  body: string;
  can_send: boolean;
  send_blocked_reason: string | null;
  provider: string | null;
}

export interface OutreachEmail {
  id: string;
  opportunity_id: string | null;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  provider: string;
  status: "queued" | "sent" | "failed";
  error: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface MentorshipPartner {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

export interface MentorshipRequest {
  id: string;
  topic: string | null;
  message: string;
  status: MentorshipStatus;
  response_message: string | null;
  responded_at: string | null;
  created_at: string;
  mentee: MentorshipPartner;
  mentor: MentorshipPartner;
}

export interface Source {
  id: string;
  slug: string;
  name: string;
  kind: string;
  adapter: string;
  base_url: string | null;
  enabled: boolean;
  requires_credentials: boolean;
  last_run_at: string | null;
  last_run_status: string | null;
  last_run_message: string | null;
}

export interface Freshness {
  last_refreshed_at: string | null;
  age_seconds: number | null;
  enabled_sources: number;
  can_refresh: boolean;
  retry_after_seconds: number;
  scheduled_every_hours: number;
}

export interface RegionFacet {
  value: string;
  label: string;
  country_count: number;
  count: number;
}

export interface Facets {
  regions: RegionFacet[];
  opportunity_types: { value: string; count: number | null }[];
  fields_of_study: { value: string; count: number | null }[];
  countries: { value: string; count: number | null }[];
  degree_levels: { value: string; count: number | null }[];
  funding_types: { value: string; count: number | null }[];
}

/* ---------------- Admin-managed site content ---------------- */

export type MediaSlot =
  | "hero"
  | "closing"
  | "mentor_card"
  | "footer"
  | "signin"
  | "community"
  | "gallery";

export interface MediaAsset {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  kind: "image" | "gif" | "video";
  width: number | null;
  height: number | null;
  title: string | null;
  alt_text: string;
  credit: string | null;
  slots: MediaSlot[];
  position: number;
  enabled: boolean;
  overlay: number | null;
  url: string;
  created_at: string;
}

export interface SlotOption {
  value: MediaSlot;
  label: string;
  asset_count: number;
}

export interface AdminStory {
  id: string;
  name: string;
  outcome: string;
  field: string | null;
  quote: string;
  institution: string | null;
  country: string | null;
  link_url: string | null;
  photo_url: string | null;
  initials: string;
  position: number;
  published: boolean;
  consent_confirmed: boolean;
  consent_note: string | null;
  created_at: string;
}

export interface Connection {
  provider: string;
  provider_account_id: string;
  scopes: string[];
  connected_at: string;
  expires_at: string | null;
  has_refresh_token: boolean;
  can_send_mail: boolean;
  blocked_reason: string | null;
}

export interface Connections {
  connections: Connection[];
  can_send_email_as_self: boolean;
  sending_provider: string | null;
}

/** A live immigration headline shown in the Counsel rail before a search. */
export type NewsItem = {
  title: string;
  url: string;
  summary: string | null;
  source: string;
  region: string;
  published_at: string | null;
};

export type NewsFeed = { items: NewsItem[] };
