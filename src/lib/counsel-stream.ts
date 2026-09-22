"use client";

export interface StreamCitation {
  position: number;
  document_id: string;
  document_title: string;
  document_kind: string;
  page_number: number | null;
  section: string | null;
  excerpt: string;
  score: number;
}

export interface StreamWebSource {
  title: string;
  url: string;
}

export interface StreamHandlers {
  onStatus?: (stage: string, extra: { grounded?: boolean; queries?: string[] }) => void;
  onConversation?: (id: string, title: string) => void;
  onCitations?: (items: StreamCitation[]) => void;
  onToken?: (text: string) => void;
  onReasoning?: (text: string) => void;
  onWeb?: (items: StreamWebSource[]) => void;
  onDone?: (info: {
    messageId: string;
    conversationId: string;
    latencyMs: number;
    model: string | null;
    grounded: boolean;
  }) => void;
  onError?: (detail: string) => void;
}

/**
 * Consume the Counsel SSE stream.
 *
 * Hand-parsed rather than using EventSource, because EventSource cannot issue
 * a POST and the request carries the question, the opportunity context and the
 * web toggle.
 *
 * Returns an abort function so a pane close or a new question cancels the
 * in-flight answer instead of leaving it writing into a discarded thread.
 */
export function streamCounsel(
  body: Record<string, unknown>,
  handlers: StreamHandlers,
): () => void {
  const controller = new AbortController();

  (async () => {
    let response: Response;
    try {
      response = await fetch("/api/counsel/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        handlers.onError?.("Could not reach Counsel.");
      }
      return;
    }

    if (!response.ok || !response.body) {
      handlers.onError?.(`Counsel returned ${response.status}.`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line; a frame may arrive split
        // across chunks, so only complete ones are consumed.
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame.split("\n").find((part) => part.startsWith("data: "));
          if (!line) continue;
          let event: Record<string, unknown>;
          try {
            event = JSON.parse(line.slice(6));
          } catch {
            continue;
          }

          switch (event.type) {
            case "status":
              handlers.onStatus?.(String(event.stage), {
                grounded: event.grounded as boolean | undefined,
                queries: event.queries as string[] | undefined,
              });
              break;
            case "conversation":
              handlers.onConversation?.(String(event.id), String(event.title));
              break;
            case "citations":
              handlers.onCitations?.(event.items as StreamCitation[]);
              break;
            case "token":
              handlers.onToken?.(String(event.text));
              break;
            case "reasoning":
              handlers.onReasoning?.(String(event.text));
              break;
            case "web":
              handlers.onWeb?.(event.items as StreamWebSource[]);
              break;
            case "done":
              handlers.onDone?.({
                messageId: String(event.message_id),
                conversationId: String(event.conversation_id),
                latencyMs: Number(event.latency_ms ?? 0),
                model: (event.model as string) ?? null,
                grounded: Boolean(event.grounded),
              });
              break;
            case "error":
              handlers.onError?.(String(event.detail));
              break;
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        handlers.onError?.("The connection dropped mid-answer.");
      }
    }
  })();

  return () => controller.abort();
}

const STAGE_LABELS: Record<string, string> = {
  starting: "Starting a new thread",
  retrieving: "Reading your dossier",
  answering: "Writing",
  searching_web: "Searching the web",
};

export function stageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? "Working";
}
