"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { sendChatAction, type ChatActionResult } from "@/lib/ai-actions";
import { NavIcon } from "./nav-icon";
import { SpeakButton } from "./speak-button";
import { VoiceRecorder } from "./voice-recorder";
import { useProgress } from "./progress-rail";
import { Tag, cx } from "./ui";
import { COUNSEL } from "@/lib/navigation";
import { kindLabel } from "@/lib/document-kinds";

export interface OpportunityContext {
  id: string;
  title: string;
  organization?: string | null;
  opportunity_type?: string | null;
  country?: string | null;
  funding_type?: string | null;
  application_deadline?: string | null;
  degree_levels?: string[];
  fields_of_study?: string[];
  description?: string | null;
  url?: string | null;
}

interface CounselValue {
  open: (context?: OpportunityContext, seedQuestion?: string) => void;
  close: () => void;
  isOpen: boolean;
}

const CounselContext = createContext<CounselValue | null>(null);

export function useCounsel(): CounselValue {
  const context = useContext(CounselContext);
  if (!context) throw new Error("useCounsel must be used inside <CounselProvider>");
  return context;
}

interface Turn {
  id: string;
  role: "user" | "assistant";
  content: string;
  viaVoice?: boolean;
  grounded?: boolean;
  usedWeb?: boolean;
  citations?: NonNullable<ChatActionResult["citations"]>;
  webSources?: NonNullable<ChatActionResult["webSources"]>;
  searchQueries?: string[];
  reasoning?: string | null;
  model?: string | null;
  latencyMs?: number | null;
}

const GENERAL_PROMPTS = [
  "What are the weakest parts of my statement of purpose?",
  "Which of my projects best shows research ability?",
  "Summarise my technical skills as a committee would read them.",
];

const OPPORTUNITY_PROMPTS = [
  "Should I apply for this? Be honest about my chances.",
  "What does my CV lack for this specific posting?",
  "What should I say in my statement to fit this?",
  "What is the deadline and what do I need to submit?",
];

/**
 * Counsel — the floating advisor.
 *
 * Deliberately not a nav destination. The questions it answers arise *while*
 * reading an opportunity or a review, and making someone navigate away to ask
 * loses the very context that makes the answer useful. It follows the page
 * instead, and can be opened already pointed at whatever they are looking at.
 */
export function CounselProvider({
  children,
  hasDocuments,
}: {
  children: React.ReactNode;
  hasDocuments: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<OpportunityContext | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [reasoning, setReasoning] = useState(false);
  const [web, setWeb] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openReasoning, setOpenReasoning] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const progress = useProgress();

  const open = useCallback((next?: OpportunityContext, seed?: string) => {
    setIsOpen(true);
    if (next) {
      setContext((current) => {
        // Switching opportunity starts a fresh thread; the old one is kept.
        if (current?.id !== next.id) {
          setTurns([]);
          setConversationId(null);
        }
        return next;
      });
    }
    if (seed) setInput(seed);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [isOpen, close]);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, busy, isOpen]);

  const send = useCallback(
    async (text: string, viaVoice = false) => {
      const message = text.trim();
      if (!message || busy) return;

      setError(null);
      setInput("");
      setBusy(true);
      setTurns((current) => [
        ...current,
        { id: `u-${Date.now()}`, role: "user", content: message, viaVoice },
      ]);

      const task = progress.start(web ? "Searching the web" : "Reading your documents");

      const result = await sendChatAction({
        message,
        conversationId,
        reasoning,
        voice: viaVoice,
        web,
        opportunity: context ? ({ ...context } as Record<string, unknown>) : undefined,
      });

      setBusy(false);

      if (!result.ok) {
        task.fail("Counsel failed");
        setError(result.message);
        return;
      }

      task.done();
      if (result.conversationId) setConversationId(result.conversationId);
      setTurns((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: result.answer ?? "",
          grounded: result.grounded,
          usedWeb: result.usedWeb,
          citations: result.citations,
          webSources: result.webSources,
          searchQueries: result.searchQueries,
          reasoning: result.reasoning,
          model: result.model,
          latencyMs: result.latencyMs,
        },
      ]);
    },
    [busy, conversationId, context, reasoning, web, progress],
  );

  const prompts = context ? OPPORTUNITY_PROMPTS : GENERAL_PROMPTS;

  return (
    <CounselContext.Provider value={{ open, close, isOpen }}>
      {/* The page blurs behind the pane so attention lands in one place. */}
      <div
        className={cx(
          "transition-[filter] duration-400 ease-out",
          isOpen && "blur-[10px]",
        )}
        aria-hidden={isOpen}
      >
        {children}
      </div>

      {/* Launcher */}
      {!isOpen ? (
        <button
          type="button"
          onClick={() => open()}
          aria-label={`Open ${COUNSEL.name}`}
          className={cx(
            "group fixed bottom-6 right-6 z-[120] inline-flex items-center gap-2.5 rounded-pill bg-char",
            "py-3.5 pl-4 pr-5 text-paper transition-all duration-300 hover:bg-ink hover:pr-6",
          )}
        >
          <NavIcon name="sparkle" className="transition-transform duration-500 group-hover:rotate-90" />
          <span className="text-[13px] font-medium">{COUNSEL.name}</span>
        </button>
      ) : null}

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Close Counsel"
            onClick={close}
            className="animate-scrim-in fixed inset-0 z-[110] cursor-default bg-midnight/25"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label={COUNSEL.name}
            className="animate-slide-in-right fixed inset-y-0 right-0 z-[120] flex w-full max-w-[520px] flex-col border-l border-mist bg-paper"
          >
            {/* Header */}
            <div className="shrink-0 border-b border-mist px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <NavIcon name="sparkle" className="text-ember" />
                    <h2 className="text-[18px] text-ink">{COUNSEL.name}</h2>
                  </div>
                  <p className="mt-0.5 text-[12px] text-smoke">{COUNSEL.tagline}</p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="shrink-0 text-smoke transition-colors hover:text-ink"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {context ? (
                <div className="mt-4 flex items-start gap-2 rounded-card bg-mist px-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] uppercase tracking-wide text-smoke">
                      Asking about
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-ink">
                      {context.title}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setContext(null);
                      setTurns([]);
                      setConversationId(null);
                    }}
                    className="shrink-0 text-[11px] text-pewter transition-colors hover:text-ink"
                  >
                    Clear
                  </button>
                </div>
              ) : null}
            </div>

            {/* Thread */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {turns.length === 0 ? (
                <div>
                  <p className="text-[14px] leading-relaxed text-pewter">
                    {context
                      ? "Ask anything about this opening — whether it fits, what your file is missing, what the posting actually requires."
                      : hasDocuments
                        ? "Answers come from the documents in your dossier and cite them. Turn on the web for anything they cannot answer."
                        : "Your dossier is empty, so there is nothing to ground answers in yet. The web toggle still works for general questions."}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {prompts.map((prompt) => (
                      <li key={prompt}>
                        <button
                          type="button"
                          onClick={() => void send(prompt)}
                          className="text-left text-[13px] leading-snug text-ember transition-opacity hover:opacity-70"
                        >
                          {prompt} →
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="space-y-6">
                {turns.map((turn) =>
                  turn.role === "user" ? (
                    <div key={turn.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-card bg-mist px-4 py-3">
                        {turn.viaVoice ? (
                          <p className="mb-1 text-[10px] uppercase tracking-wide text-smoke">
                            Spoken
                          </p>
                        ) : null}
                        <p className="text-[14px] leading-relaxed text-ink">{turn.content}</p>
                      </div>
                    </div>
                  ) : (
                    <article key={turn.id}>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {turn.usedWeb ? <Tag tone="ember">From the web</Tag> : null}
                        {turn.grounded === false && !turn.usedWeb ? (
                          <Tag tone="outline">Not in your dossier</Tag>
                        ) : null}
                      </div>

                      <div className="whitespace-pre-wrap text-[14px] leading-[1.6] text-ink">
                        {turn.content}
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center gap-3">
                        <SpeakButton text={turn.content} />
                        {turn.latencyMs ? (
                          <span className="text-[11px] text-smoke">
                            {(turn.latencyMs / 1000).toFixed(1)}s
                          </span>
                        ) : null}
                        {turn.reasoning ? (
                          <button
                            type="button"
                            onClick={() =>
                              setOpenReasoning(openReasoning === turn.id ? null : turn.id)
                            }
                            className="text-[11px] text-smoke transition-colors hover:text-ink"
                          >
                            {openReasoning === turn.id ? "Hide reasoning" : "Reasoning"}
                          </button>
                        ) : null}
                      </div>

                      {openReasoning === turn.id && turn.reasoning ? (
                        <pre className="mt-2.5 max-h-[220px] overflow-auto whitespace-pre-wrap rounded-card bg-mist p-3 font-sans text-[11px] leading-relaxed text-pewter">
                          {turn.reasoning}
                        </pre>
                      ) : null}

                      {turn.citations && turn.citations.length > 0 ? (
                        <ol className="mt-3 space-y-1.5">
                          {turn.citations.map((citation) => (
                            <li
                              key={`${turn.id}-d-${citation.position}`}
                              className="rounded-card border border-mist px-3 py-2"
                            >
                              <p className="text-[11px] text-ink">
                                [{citation.position}] {citation.document_title}
                                <span className="text-smoke">
                                  {" · "}
                                  {kindLabel(citation.document_kind)}
                                  {citation.page_number ? ` · p.${citation.page_number}` : ""}
                                </span>
                              </p>
                              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-pewter">
                                {citation.excerpt}
                              </p>
                            </li>
                          ))}
                        </ol>
                      ) : null}

                      {turn.webSources && turn.webSources.length > 0 ? (
                        <ul className="mt-3 space-y-1">
                          {turn.webSources.map((source) => (
                            <li key={source.url}>
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block truncate text-[11px] text-ember hover:underline"
                              >
                                ↗ {source.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  ),
                )}

                {busy ? (
                  <p className="text-[13px] text-smoke">
                    {web
                      ? "Searching the web…"
                      : reasoning
                        ? "Reasoning over your dossier…"
                        : "Reading your dossier…"}
                  </p>
                ) : null}

                {error ? (
                  <div className="rounded-card border border-coral/50 px-3 py-2.5 text-[12px] text-ink">
                    {error}
                  </div>
                ) : null}

                <div ref={endRef} />
              </div>
            </div>

            {/* Composer */}
            <div className="shrink-0 border-t border-mist px-6 py-4">
              <div className="mb-3 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setWeb((value) => !value)}
                  aria-pressed={web}
                  className={cx(
                    "inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[11px] font-medium transition-colors",
                    web
                      ? "bg-ember text-paper"
                      : "text-pewter ring-1 ring-inset ring-mist hover:ring-smoke",
                  )}
                >
                  Search the web
                </button>
                <button
                  type="button"
                  onClick={() => setReasoning((value) => !value)}
                  aria-pressed={reasoning}
                  className={cx(
                    "inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[11px] font-medium transition-colors",
                    reasoning
                      ? "bg-char text-paper"
                      : "text-pewter ring-1 ring-inset ring-mist hover:ring-smoke",
                  )}
                >
                  Think harder
                </button>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void send(input);
                }}
                className="flex items-end gap-2"
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
                      void send(input);
                    }
                  }}
                  rows={1}
                  disabled={busy}
                  placeholder={context ? "Ask about this opening…" : "Ask anything…"}
                  className="min-h-[44px] flex-1 resize-y rounded-small border border-mist bg-paper px-3 py-3 text-[14px] text-ink placeholder:text-smoke focus:border-ink focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  aria-label="Send"
                  className="h-11 shrink-0 rounded-button bg-char px-4 text-[13px] font-medium text-paper transition-colors hover:bg-ink disabled:bg-smoke"
                >
                  Ask
                </button>
              </form>
              {web ? (
                <p className="mt-2 text-[10px] leading-relaxed text-smoke">
                  Web search costs noticeably more per question than reading your own
                  documents. It stays off until you turn it on.
                </p>
              ) : null}
            </div>
          </aside>
        </>
      ) : null}
    </CounselContext.Provider>
  );
}

/** Opens Counsel already pointed at one opportunity. */
export function AskAboutButton({
  opportunity,
  label = "Ask Counsel about this",
  className,
}: {
  opportunity: OpportunityContext;
  label?: string;
  className?: string;
}) {
  const counsel = useCounsel();
  return (
    <button
      type="button"
      onClick={() => counsel.open(opportunity)}
      className={cx(
        "group inline-flex items-center gap-2 text-[13px] text-ink transition-colors hover:text-ember",
        className,
      )}
    >
      <NavIcon name="sparkle" className="text-ember" />
      <span className="border-b border-transparent pb-px group-hover:border-current">
        {label}
      </span>
    </button>
  );
}
