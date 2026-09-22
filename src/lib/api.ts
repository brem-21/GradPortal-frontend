import { auth } from "@/auth";
import type {
  AdminStory,
  Facets,
  Freshness,
  Me,
  MediaAsset,
  MentorCard,
  MentorshipRequest,
  Notification,
  Opportunity,
  OutreachDraft,
  OutreachEmail,
  OverviewStats,
  Page,
  Profile,
  SavedOpportunity,
  SlotOption,
  Source,
} from "@/types/api";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NotAuthenticatedError extends Error {
  constructor() {
    super("No active session");
    this.name = "NotAuthenticatedError";
  }
}

type Query = Record<string, string | number | boolean | string[] | undefined | null>;

function buildQuery(params?: Query): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      // FastAPI reads repeated keys as a list.
      value.forEach((entry) => search.append(key, String(entry)));
    } else {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  /** Opportunity data changes on a crawl cadence, not per request. */
  revalidate?: number;
  tags?: string[];
}

/**
 * Server-only API client. The bearer token lives in the Auth.js session cookie
 * and is never exposed to the browser, so every call runs in a server component
 * or a server action.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const session = await auth();
  if (!session?.apiToken) throw new NotAuthenticatedError();

  const { method = "GET", body, query, revalidate, tags } = options;
  const url = `${API_BASE_URL}${path}${buildQuery(query)}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${session.apiToken}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...(method === "GET"
      ? { next: { revalidate: revalidate ?? 0, tags } }
      : { cache: "no-store" as const }),
  });

  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const payload = await response.json();
      if (typeof payload?.detail === "string") {
        detail = payload.detail;
      } else if (Array.isArray(payload?.detail)) {
        // FastAPI validation errors arrive as a list of {loc, msg}.
        detail = payload.detail
          .map((e: { loc?: unknown[]; msg?: string }) => e.msg ?? "invalid input")
          .join("; ");
      }
    } catch {
      /* non-JSON error body; keep the status line */
    }
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/* ---------------- Typed endpoints ---------------- */

export const api = {
  me: () => apiFetch<Me>("/users/me"),

  completeOnboarding: (body: unknown) =>
    apiFetch<Me>("/users/me/onboarding", { method: "POST", body }),

  updateProfile: (body: unknown) =>
    apiFetch<Profile>("/users/me/profile", { method: "PUT", body }),

  updatePreferences: (body: unknown) =>
    apiFetch<unknown>("/users/me/preferences", { method: "PUT", body }),

  overview: () => apiFetch<OverviewStats>("/opportunities/overview"),

  facets: () => apiFetch<Facets>("/opportunities/facets", { revalidate: 300 }),

  freshness: () => apiFetch<Freshness>("/opportunities/freshness"),

  refreshOpportunities: () =>
    apiFetch<{ started: boolean; detail: string }>("/opportunities/refresh", {
      method: "POST",
    }),

  opportunities: (query?: Query) =>
    apiFetch<Page<Opportunity>>("/opportunities", { query, revalidate: 60 }),

  opportunity: (id: string) => apiFetch<Opportunity>(`/opportunities/${id}`),

  createOpportunity: (body: unknown) =>
    apiFetch<Opportunity>("/opportunities", { method: "POST", body }),

  updateOpportunity: (id: string, body: unknown) =>
    apiFetch<Opportunity>(`/opportunities/${id}`, { method: "PATCH", body }),

  reviewQueue: (query?: Query) =>
    apiFetch<Page<Opportunity>>("/admin/opportunities/review-queue", { query }),

  // core-api path, not the /shortlist page route.
  saved: (query?: Query) => apiFetch<Page<SavedOpportunity>>("/saved", { query }),

  save: (id: string, body: unknown) =>
    apiFetch<SavedOpportunity>(`/opportunities/${id}/save`, { method: "PUT", body }),

  unsave: (id: string) =>
    apiFetch<unknown>(`/opportunities/${id}/save`, { method: "DELETE" }),

  draftEmail: (body: unknown) =>
    apiFetch<OutreachDraft>("/outreach/draft", { method: "POST", body }),

  sendEmail: (body: unknown) =>
    apiFetch<OutreachEmail>("/outreach/send", { method: "POST", body }),

  outreach: (query?: Query) => apiFetch<Page<OutreachEmail>>("/outreach", { query }),

  notifications: (query?: Query) =>
    apiFetch<Page<Notification>>("/notifications", { query }),

  markNotificationRead: (id: string) =>
    apiFetch<Notification>(`/notifications/${id}/read`, { method: "POST" }),

  markAllNotificationsRead: () =>
    apiFetch<unknown>("/notifications/read-all", { method: "POST" }),

  mentors: (query?: Query) => apiFetch<Page<MentorCard>>("/mentors", { query }),

  mentorshipRequests: (query?: Query) =>
    apiFetch<Page<MentorshipRequest>>("/mentorship/requests", { query }),

  requestMentorship: (body: unknown) =>
    apiFetch<MentorshipRequest>("/mentorship/requests", { method: "POST", body }),

  respondToMentorship: (id: string, body: unknown) =>
    apiFetch<MentorshipRequest>(`/mentorship/requests/${id}/respond`, {
      method: "POST",
      body,
    }),

  sources: () => apiFetch<Source[]>("/admin/sources"),

  runSource: (id: string) =>
    apiFetch<Record<string, unknown>>(`/admin/sources/${id}/run`, { method: "POST" }),

  runAllSources: () => apiFetch<unknown>("/admin/sources/run-all", { method: "POST" }),

  seedSources: () => apiFetch<unknown>("/admin/sources/seed", { method: "POST" }),

  updateSource: (id: string, body: unknown) =>
    apiFetch<Source>(`/admin/sources/${id}`, { method: "PATCH", body }),

  /* -------- Admin: site media -------- */
  mediaSlots: () => apiFetch<SlotOption[]>("/admin/media/slots"),

  mediaAssets: (slot?: string) =>
    apiFetch<{ items: MediaAsset[]; total: number }>("/admin/media", {
      query: { slot },
    }),

  updateMedia: (id: string, body: unknown) =>
    apiFetch<MediaAsset>(`/admin/media/${id}`, { method: "PATCH", body }),

  deleteMedia: (id: string) =>
    apiFetch<{ detail: string }>(`/admin/media/${id}`, { method: "DELETE" }),

  /* -------- Admin: success stories -------- */
  adminStories: () =>
    apiFetch<{ items: AdminStory[]; total: number }>("/admin/stories"),

  createStory: (body: unknown) =>
    apiFetch<AdminStory>("/admin/stories", { method: "POST", body }),

  updateStory: (id: string, body: unknown) =>
    apiFetch<AdminStory>(`/admin/stories/${id}`, { method: "PATCH", body }),

  deleteStory: (id: string) =>
    apiFetch<{ detail: string }>(`/admin/stories/${id}`, { method: "DELETE" }),
};
