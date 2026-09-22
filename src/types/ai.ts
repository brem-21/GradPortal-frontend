export type DocumentKind =
  | "cv"
  | "sop"
  | "motivation_letter"
  | "recommendation"
  | "transcript"
  | "research_proposal"
  | "other";

export type DocumentStatus = "pending" | "processing" | "indexed" | "failed";

export type Track = "masters" | "phd";

export type Severity = "strength" | "minor" | "major" | "critical";

export interface AppDocument {
  id: string;
  kind: DocumentKind;
  title: string | null;
  filename: string;
  content_type: string;
  size_bytes: number;
  page_count: number | null;
  word_count: number;
  chunk_count: number;
  status: DocumentStatus;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentList {
  items: AppDocument[];
  total: number;
}

export interface DocumentStats {
  by_kind: Record<string, number>;
  total_documents: number;
  total_words: number;
}

export interface Finding {
  id: string;
  criterion_key: string;
  criterion_label: string;
  weight: number;
  score: number;
  severity: Severity;
  title: string;
  detail: string;
  evidence: string | null;
  suggestion: string | null;
}

export interface Assessment {
  id: string;
  document_id: string;
  document_kind: DocumentKind;
  document_title: string;
  rubric_label: string;
  score: number;
  summary: string;
  status: string;
  error: string | null;
  findings: Finding[];
}

export interface EvaluationRun {
  id: string;
  track: Track;
  target_field: string | null;
  target_programs: string | null;
  status: "queued" | "running" | "completed" | "failed";
  error: string | null;
  overall_score: number | null;
  verdict: string | null;
  summary: string | null;
  committee_note: string | null;
  priority_actions: string[];
  missing_documents: string[];
  model: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface EvaluationDetail extends EvaluationRun {
  assessments: Assessment[];
}

export interface RubricCriterion {
  key: string;
  label: string;
  weight: number;
  question: string;
  strong_signal: string;
  weak_signal: string;
}

export interface Rubric {
  document_kind: string;
  track: Track;
  label: string;
  reader: string;
  criteria: RubricCriterion[];
}

export interface Citation {
  id: string;
  position: number;
  document_id: string;
  chunk_id: string;
  document_title: string;
  document_kind: DocumentKind;
  page_number: number | null;
  section: string | null;
  excerpt: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  input_mode: "text" | "voice";
  used_reasoning: boolean;
  reasoning: string | null;
  search_queries: string[];
  grounded: boolean;
  model: string | null;
  latency_ms: number | null;
  created_at: string;
  citations: Citation[];
}

export interface Conversation {
  id: string;
  title: string;
  document_ids: string[];
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: ChatMessage[];
}

export interface ChatResponse {
  conversation_id: string;
  title: string;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

export interface ServiceHealth {
  service: string;
  status: "healthy" | "degraded";
  checks: Record<string, string>;
  models?: Record<string, string>;
}
