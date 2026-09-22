"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { ai } from "@/lib/ai-api";
import { ApiError } from "@/lib/api";

function fail(error: unknown): ActionState {
  if (error instanceof ApiError) return { ok: false, message: error.message };
  console.error("[ai-action]", error);
  return { ok: false, message: "Something went wrong. Try again." };
}

/* ---------------- Documents ---------------- */

export async function deleteDocumentAction(id: string): Promise<ActionState> {
  try {
    await ai.deleteDocument(id);
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/documents");
  revalidatePath("/evaluate");
  return { ok: true, message: "Document removed." };
}

export async function reindexDocumentAction(id: string): Promise<ActionState> {
  try {
    await ai.reindexDocument(id);
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/documents");
  return { ok: true, message: "Re-indexed." };
}

export async function retypeDocumentAction(
  id: string,
  kind: string,
): Promise<ActionState> {
  try {
    await ai.updateDocument(id, { kind });
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/documents");
  revalidatePath("/evaluate");
  return { ok: true, message: "Type updated." };
}

/* ---------------- Evaluation ---------------- */

export async function startEvaluationAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState & { runId?: string }> {
  const track = String(form.get("track") ?? "masters");
  const documentIds = form.getAll("document_ids").map(String).filter(Boolean);
  const targetField = String(form.get("target_field") ?? "").trim() || null;
  const targetPrograms = String(form.get("target_programs") ?? "").trim() || null;

  if (documentIds.length === 0) {
    return { ok: false, message: "Select at least one document to review." };
  }

  try {
    const run = await ai.startEvaluation({
      track,
      document_ids: documentIds,
      target_field: targetField,
      target_programs: targetPrograms,
    });
    revalidatePath("/evaluate");
    if (run.status === "failed") {
      return { ok: false, message: run.error ?? "The review could not be completed." };
    }
    return { ok: true, message: "Review complete.", runId: run.id };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteEvaluationAction(id: string): Promise<ActionState> {
  try {
    await ai.deleteEvaluation(id);
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/evaluate");
  return { ok: true, message: "Evaluation deleted." };
}

/* ---------------- Chat ---------------- */

export interface ChatActionResult extends ActionState {
  conversationId?: string;
  answer?: string;
  citations?: {
    position: number;
    document_title: string;
    document_kind: string;
    page_number: number | null;
    section: string | null;
    excerpt: string;
    score: number;
  }[];
  searchQueries?: string[];
  grounded?: boolean;
  reasoning?: string | null;
  model?: string | null;
  latencyMs?: number | null;
}

export async function sendChatAction(input: {
  message: string;
  conversationId?: string | null;
  reasoning: boolean;
  voice: boolean;
}): Promise<ChatActionResult> {
  const message = input.message.trim();
  if (!message) return { ok: false, message: "Type or say something first." };

  try {
    const response = await ai.chat({
      message,
      conversation_id: input.conversationId ?? null,
      reasoning: input.reasoning,
      voice: input.voice,
      input_mode: input.voice ? "voice" : "text",
    });
    revalidatePath("/assistant");
    const assistant = response.assistant_message;
    return {
      ok: true,
      message: null,
      conversationId: response.conversation_id,
      answer: assistant.content,
      citations: assistant.citations.map((citation) => ({
        position: citation.position,
        document_title: citation.document_title,
        document_kind: citation.document_kind,
        page_number: citation.page_number,
        section: citation.section,
        excerpt: citation.excerpt,
        score: citation.score,
      })),
      searchQueries: assistant.search_queries,
      grounded: assistant.grounded,
      reasoning: assistant.reasoning,
      model: assistant.model,
      latencyMs: assistant.latency_ms,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteConversationAction(id: string): Promise<ActionState> {
  try {
    await ai.deleteConversation(id);
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/assistant");
  return { ok: true, message: "Conversation deleted." };
}
