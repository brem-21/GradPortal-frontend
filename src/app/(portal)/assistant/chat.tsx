"use client";

import { useEffect, useRef, useState } from "react";
import { sendChatAction, type ChatActionResult } from "@/lib/ai-actions";
import { SpeakButton } from "@/components/speak-button";
import { VoiceRecorder } from "@/components/voice-recorder";
import { Tag, cx } from "@/components/ui";
import { kindLabel } from "@/lib/document-kinds";
import type { ChatMessage } from "@/types/ai";

interface Turn {
  id: string;
  role: "user" | "assistant";
  content: string;
  viaVoice: boolean;
  grounded?: boolean;
  citations?: NonNullable<ChatActionResult["citations"]>;
  searchQueries?: string[];
  reasoning?: string | null;
  model?: string | null;
  latencyMs?: number | null;
}

const SUGGESTIONS = [
  "What are the weakest parts of my statement of purpose?",
  "Which of my projects best shows research ability?",
  "Do my documents mention any teaching experience?",
  "Summarise my technical skills as a committee would read them.",
];

function toTurn(message: ChatMessage): Turn {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    viaVoice: message.input_mode === "voice",
    grounded: message.grounded,
    citations: message.citations.map((citation) => ({
      position: citation.position,
      document_title: citation.document_title,
      document_kind: citation.document_kind,
      page_number: citation.page_number,
      section: citation.section,
      excerpt: citation.excerpt,
      score: citation.score,
    })),
    searchQueries: message.search_queries,
    reasoning: message.reasoning,
    model: message.model,
    latencyMs: message.latency_ms,
  };
}

export function Chat({
  initialConversationId,
  initialMessages,
  hasDocuments,
}: {
  initialConversationId: string | null;
  initialMessages: ChatMessage[];
  hasDocuments: boolean;
}) {
  const [turns, setTurns] = useState<Turn[]>(initialMessages.map(toTurn));
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId,
  );
  const [input, setInput] = useState("");
  const [reasoning, setReasoning] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openReasoning, setOpenReasoning] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, busy]);

  async function send(text: string, viaVoice: boolean) {
    const message = text.trim();
    if (!message || busy) return;

    setError(null);
    setInput("");
    setBusy(true);
    setTurns((current) => [
      ...current,
      { id: `local-${Date.now()}`, role: "user", content: message, viaVoice },
    ]);

    const result = await sendChatAction({
      message,
      conversationId,
      reasoning,
      voice: viaVoice || speakReplies,
    });

    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    if (result.conversationId) setConversationId(result.conversationId);
    setTurns((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.answer ?? "",
        viaVoice: false,
        grounded: result.grounded,
        citations: result.citations,
        searchQueries: result.searchQueries,
        reasoning: result.reasoning,
        model: result.model,
        latencyMs: result.latencyMs,
      },
    ]);
  }

  return (
    <div className="flex min-h-[60vh] flex-col">
      <div className="flex-1 space-y-8">
        {turns.length === 0 ? (
          <div className="rounded-card border border-mist p-6">
            <p className="text-[15px] text-ink">
              Ask anything about your own documents.
            </p>
            <p className="prose-column mt-2 text-[13px] leading-relaxed text-pewter">
              Answers come only from what you have uploaded, with a citation on every
              claim. If your documents do not cover something, it will say so rather
              than guess.
            </p>
            {hasDocuments ? (
              <ul className="mt-5 space-y-2">
                {SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => void send(suggestion, false)}
                      className="text-left text-[13px] text-ember transition-opacity hover:opacity-70"
                    >
                      {suggestion} →
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {turns.map((turn) =>
          turn.role === "user" ? (
            <div key={turn.id} className="flex justify-end">
              <div className="max-w-[80%] rounded-card bg-mist px-5 py-4">
                {turn.viaVoice ? (
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-smoke">
                    Spoken
                  </p>
                ) : null}
                <p className="text-[15px] leading-[1.5] text-ink">{turn.content}</p>
              </div>
            </div>
          ) : (
            <article key={turn.id} className="max-w-[85%]">
              {turn.grounded === false ? (
                <Tag tone="ember" className="mb-3">
                  Not in your documents
                </Tag>
              ) : null}

              <div className="prose-column whitespace-pre-wrap text-[15px] leading-[1.6] text-ink">
                {turn.content}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4">
                <SpeakButton text={turn.content} />
                {turn.latencyMs ? (
                  <span className="text-[12px] text-smoke">
                    {(turn.latencyMs / 1000).toFixed(1)}s
                    {turn.model ? ` · ${turn.model}` : ""}
                  </span>
                ) : null}
                {turn.reasoning ? (
                  <button
                    type="button"
                    onClick={() =>
                      setOpenReasoning(openReasoning === turn.id ? null : turn.id)
                    }
                    className="text-[12px] text-smoke transition-colors hover:text-ink"
                  >
                    {openReasoning === turn.id ? "Hide reasoning" : "Show reasoning"}
                  </button>
                ) : null}
              </div>

              {openReasoning === turn.id && turn.reasoning ? (
                <pre className="mt-3 max-h-[320px] overflow-auto whitespace-pre-wrap rounded-card bg-mist p-4 font-sans text-[12px] leading-relaxed text-pewter">
                  {turn.reasoning}
                </pre>
              ) : null}

              {turn.searchQueries && turn.searchQueries.length > 0 ? (
                <p className="mt-3 text-[12px] text-smoke">
                  Searched your documents for:{" "}
                  {turn.searchQueries.map((q) => `“${q}”`).join(", ")}
                </p>
              ) : null}

              {turn.citations && turn.citations.length > 0 ? (
                <ol className="mt-4 space-y-2">
                  {turn.citations.map((citation) => (
                    <li
                      key={`${turn.id}-${citation.position}`}
                      className="rounded-card border border-mist px-4 py-3"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-[12px] text-ink">
                          [{citation.position}] {citation.document_title}
                          <span className="text-smoke">
                            {" · "}
                            {kindLabel(citation.document_kind)}
                            {citation.section ? ` · ${citation.section}` : ""}
                            {citation.page_number ? ` · p.${citation.page_number}` : ""}
                          </span>
                        </span>
                        <span className="text-[11px] text-smoke">
                          match {(citation.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-pewter">
                        {citation.excerpt}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : null}
            </article>
          ),
        )}

        {busy ? (
          <p className="text-[13px] text-smoke">
            {reasoning ? "Reasoning over your documents…" : "Searching your documents…"}
          </p>
        ) : null}

        {error ? (
          <div className="rounded-card border border-coral/50 px-4 py-3 text-[13px] text-ink">
            {error}
          </div>
        ) : null}

        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 mt-10 border-t border-mist bg-paper pb-6 pt-5">
        <div className="mb-3 flex flex-wrap items-center gap-5">
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-pewter">
            <input
              type="checkbox"
              checked={reasoning}
              onChange={(event) => setReasoning(event.target.checked)}
            />
            Reason before answering
            <span className="text-smoke">(slower, better on judgement calls)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-pewter">
            <input
              type="checkbox"
              checked={speakReplies}
              onChange={(event) => setSpeakReplies(event.target.checked)}
            />
            Shape answers for speech
          </label>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send(input, false);
          }}
          className="flex items-end gap-3"
        >
          <VoiceRecorder
            disabled={busy}
            onTranscript={(text) => {
              if (text) void send(text, true);
            }}
          />
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(input, false);
              }
            }}
            rows={1}
            placeholder="Ask about your CV, statement, letters…"
            disabled={busy}
            className={cx(
              "min-h-[44px] flex-1 resize-y rounded-small border border-mist bg-paper px-3 py-3",
              "text-[15px] text-ink placeholder:text-smoke focus:border-ink focus:outline-none",
            )}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="h-11 shrink-0 rounded-button bg-char px-5 text-[13px] font-medium text-paper transition-colors hover:bg-ink disabled:bg-smoke"
          >
            {busy ? "…" : "Ask"}
          </button>
        </form>
      </div>
    </div>
  );
}
