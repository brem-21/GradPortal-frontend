import { auth } from "@/auth";
import { ApiError, NotAuthenticatedError } from "@/lib/api";
import type {
  ChatResponse,
  ConversationDetail,
  DocumentList,
  DocumentStats,
  EvaluationDetail,
  Rubric,
  ServiceHealth,
} from "@/types/ai";

/**
 * Clients for the four AI services.
 *
 * Every call is server-side: the API bearer lives in the Auth.js session cookie
 * and must never reach the browser. Browser-originated uploads and audio go
 * through the route handlers in app/api/*, which attach the token here.
 */

export const SERVICE_URLS = {
  doc: process.env.DOC_SERVICE_URL ?? "http://localhost:8001",
  rag: process.env.RAG_SERVICE_URL ?? "http://localhost:8002",
  evaluation: process.env.EVAL_SERVICE_URL ?? "http://localhost:8003",
  voice: process.env.VOICE_SERVICE_URL ?? "http://localhost:8004",
} as const;

type ServiceName = keyof typeof SERVICE_URLS;

export async function getApiToken(): Promise<string> {
  const session = await auth();
  if (!session?.apiToken) throw new NotAuthenticatedError();
  return session.apiToken;
}

interface Options {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | string[] | undefined>;
  revalidate?: number;
}

function queryString(params?: Options["query"]): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) value.forEach((entry) => search.append(key, String(entry)));
    else search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function serviceFetch<T>(
  service: ServiceName,
  path: string,
  options: Options = {},
): Promise<T> {
  const token = await getApiToken();
  const { method = "GET", body, query, revalidate } = options;

  let response: Response;
  try {
    response = await fetch(`${SERVICE_URLS[service]}${path}${queryString(query)}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...(method === "GET"
        ? { next: { revalidate: revalidate ?? 0 } }
        : { cache: "no-store" as const }),
    });
  } catch {
    // A service being down is the common local failure; say which one.
    throw new ApiError(
      503,
      `The ${service} service is not responding at ${SERVICE_URLS[service]}. Start it and retry.`,
    );
  }

  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const payload = await response.json();
      if (typeof payload?.detail === "string") detail = payload.detail;
      else if (Array.isArray(payload?.detail)) {
        detail = payload.detail.map((e: { msg?: string }) => e.msg ?? "invalid").join("; ");
      }
    } catch {
      /* keep the status line */
    }
    throw new ApiError(response.status, detail);
  }

  // 204 and empty bodies are valid (DELETE, for one), so parse defensively.
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Health of every AI service, for the status strip. Never throws. */
export async function serviceHealth(): Promise<Record<ServiceName, ServiceHealth | null>> {
  const entries = await Promise.all(
    (Object.keys(SERVICE_URLS) as ServiceName[]).map(async (service) => {
      try {
        const response = await fetch(`${SERVICE_URLS[service]}/health`, {
          cache: "no-store",
          signal: AbortSignal.timeout(3000),
        });
        return [service, response.ok ? ((await response.json()) as ServiceHealth) : null] as const;
      } catch {
        return [service, null] as const;
      }
    }),
  );
  return Object.fromEntries(entries) as Record<ServiceName, ServiceHealth | null>;
}

export const ai = {
  // doc-service path, not the /dossier page route — these are different things.
  documents: () => serviceFetch<DocumentList>("doc", "/documents"),
  documentStats: () => serviceFetch<DocumentStats>("doc", "/documents/stats"),
  deleteDocument: (id: string) =>
    serviceFetch<void>("doc", `/documents/${id}`, { method: "DELETE" }),
  reindexDocument: (id: string) =>
    serviceFetch<unknown>("doc", `/documents/${id}/reindex`, { method: "POST" }),
  updateDocument: (id: string, body: unknown) =>
    serviceFetch<unknown>("doc", `/documents/${id}`, { method: "PATCH", body }),

  rubric: (kind: string, track: string) =>
    serviceFetch<Rubric>("evaluation", `/evaluations/rubrics/${kind}`, {
      query: { track },
      revalidate: 3600,
    }),
  rubrics: (track: string) =>
    serviceFetch<Rubric[]>("evaluation", "/evaluations/rubrics", {
      query: { track },
      revalidate: 3600,
    }),
  evaluations: () =>
    serviceFetch<{ items: EvaluationDetail[]; total: number }>("evaluation", "/evaluations"),
  evaluation: (id: string) =>
    serviceFetch<EvaluationDetail>("evaluation", `/evaluations/${id}`),
  startEvaluation: (body: unknown) =>
    serviceFetch<EvaluationDetail>("evaluation", "/evaluations", { method: "POST", body }),
  deleteEvaluation: (id: string) =>
    serviceFetch<void>("evaluation", `/evaluations/${id}`, { method: "DELETE" }),

  conversations: () =>
    serviceFetch<{ items: ConversationDetail[]; total: number }>("rag", "/conversations"),
  conversation: (id: string) =>
    serviceFetch<ConversationDetail>("rag", `/conversations/${id}`),
  chat: (body: unknown) => serviceFetch<ChatResponse>("rag", "/chat", { method: "POST", body }),
  deleteConversation: (id: string) =>
    serviceFetch<void>("rag", `/conversations/${id}`, { method: "DELETE" }),
};
