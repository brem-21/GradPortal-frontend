"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  stageLabel,
  streamCounsel,
  type StreamCitation,
  type StreamWebSource,
} from "@/lib/counsel-stream";
import { NavIcon } from "./nav-icon";
import { RichText } from "./rich-text";
import { VoiceRecorder } from "./voice-recorder";
import { useProgress } from "./progress-rail";
import { WebResultsRail } from "./web-results-rail";
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
  citations?: StreamCitation[];
  webSources?: StreamWebSource[];
  searchQueries?: string[];
  reasoning?: string | null;
  model?: string | null;
  latencyMs?: number | null;
  /** True while tokens are still arriving for this turn. */
  streaming?: boolean;
}

interface HistoryEntry {
  id: string;
  title: string;
  updated_at: string;
  opportunity_title: string | null;
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
  // On by default: answering from the reader's own dossier is the point of
  // the feature, so making them opt in each time would tax the common case.
  const [useDocuments, setUseDocuments] = useState(true);
  const [liveWeb, setLiveWeb] = useState<StreamWebSource[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openReasoning, setOpenReasoning] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const progress = useProgress();

  const refreshHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/counsel/history");
      if (!response.ok) return;
      const payload = await response.json();
      setHistory(payload.items ?? []);
    } catch {
      /* history is a convenience; failing to load it must not break the pane */
    }
  }, []);

  /** Resume a past thread with its full message history. */
  const loadConversation = useCallback(async (id: string) => {
    setHistoryOpen(false);
    setError(null);
    try {
      const response = await fetch(`/api/counsel/conversation/${id}`);
      if (!response.ok) {
        setError("That conversation could not be loaded.");
        return;
      }
      const conversation = await response.json();
      setConversationId(conversation.id);
      setConversationTitle(conversation.title);
      setContext(
        conversation.opportunity_id
          ? {
              id: conversation.opportunity_id,
              title: conversation.opportunity_title ?? "This opening",
            }
          : null,
      );
      setTurns(
        (conversation.messages ?? []).map(
          (message: {
            id: string;
            role: "user" | "assistant";
            content: string;
            input_mode: string;
            grounded: boolean;
            used_web: boolean;
            reasoning: string | null;
            model: string | null;
            latency_ms: number | null;
            search_queries: string[];
            citations: StreamCitation[];
            web_sources: StreamWebSource[];
          }) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            viaVoice: message.input_mode === "voice",
            grounded: message.grounded,
            usedWeb: message.used_web,
            reasoning: message.reasoning,
            model: message.model,
            latencyMs: message.latency_ms,
            searchQueries: message.search_queries,
            citations: message.citations,
            webSources: message.web_sources,
          }),
        ),
      );
    } catch {
      setError("That conversation could not be loaded.");
    }
  }, []);

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

  const close = useCallback(() => {
    // Abandon an in-flight answer rather than let it write into a hidden pane.
    abortRef.current?.();
    abortRef.current = null;
    setBusy(false);
    setStage(null);
    setIsOpen(false);
  }, []);

  const startNewThread = useCallback(() => {
    abortRef.current?.();
    setTurns([]);
    setConversationId(null);
    setConversationTitle(null);
    setError(null);
    setHistoryOpen(false);
  }, []);

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

  useEffect(() => {
    if (isOpen) void refreshHistory();
  }, [isOpen, refreshHistory]);

  const send = useCallback(
    async (text: string, viaVoice = false) => {
      const message = text.trim();
      if (!message || busy) return;

      setError(null);
      setInput("");
      setBusy(true);
      setStage(web ? "searching_web" : useDocuments ? "retrieving" : "answering");
      setLiveWeb([]);

      const turnId = `a-${Date.now()}`;
      setTurns((current) => [
        ...current,
        { id: `u-${Date.now()}`, role: "user", content: message, viaVoice },
        { id: turnId, role: "assistant", content: "", streaming: true },
      ]);

      const task = progress.start(web ? "Searching the web" : "Reading your dossier");

      const patch = (changes: Partial<Turn>) =>
        setTurns((current) =>
          current.map((turn) => (turn.id === turnId ? { ...turn, ...changes } : turn)),
        );

      abortRef.current = streamCounsel(
        {
          message,
          conversation_id: conversationId,
          reasoning,
          web,
          use_documents: useDocuments,
          input_mode: viaVoice ? "voice" : "text",
          opportunity_id: context?.id ?? null,
          opportunity: context ? { ...context } : null,
        },
        {
          onStatus: (nextStage, extra) => {
            setStage(nextStage);
            if (extra.queries?.length) patch({ searchQueries: extra.queries });
          },
          onConversation: (id, title) => {
            setConversationId(id);
            setConversationTitle(title);
          },
          onCitations: (items) => patch({ citations: items }),
          // Appending per token is what produces the live-writing effect.
          onToken: (chunk) =>
            setTurns((current) =>
              current.map((turn) =>
                turn.id === turnId ? { ...turn, content: turn.content + chunk } : turn,
              ),
            ),
          onReasoning: (chunk) =>
            setTurns((current) =>
              current.map((turn) =>
                turn.id === turnId
                  ? { ...turn, reasoning: (turn.reasoning ?? "") + chunk }
                  : turn,
              ),
            ),
          onWeb: (items) => {
            setLiveWeb(items);
            patch({ webSources: items, usedWeb: true });
          },
          onDone: (info) => {
            patch({
              streaming: false,
              grounded: info.grounded,
              model: info.model,
              latencyMs: info.latencyMs,
            });
            setConversationId(info.conversationId);
            setBusy(false);
            setStage(null);
            task.done();
            void refreshHistory();
          },
          onError: (detail) => {
            patch({ streaming: false });
            setError(detail);
            setBusy(false);
            setStage(null);
            task.fail("Counsel failed");
          },
        },
      );
    },
    [busy, conversationId, context, reasoning, web, useDocuments, progress, refreshHistory],
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

          <WebResultsRail
            sources={liveWeb}
            searching={busy && web && liveWeb.length === 0}
            active={turns.length > 0}
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
                  <p className="mt-0.5 truncate text-[12px] text-smoke">
                    {conversationTitle ?? COUNSEL.tagline}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setHistoryOpen((open) => !open)}
                    aria-expanded={historyOpen}
                    aria-label="Past conversations"
                    title="Past conversations"
                    className={cx(
                      "rounded-pill p-1.5 transition-colors",
                      historyOpen ? "bg-mist text-ink" : "text-smoke hover:text-ink",
                    )}
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true">
                      <circle cx="10" cy="10" r="7" />
                      <path d="M10 6v4l2.5 1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                  {turns.length > 0 ? (
                    <button
                      type="button"
                      onClick={startNewThread}
                      aria-label="New conversation"
                      title="New conversation"
                      className="rounded-pill p-1.5 text-smoke transition-colors hover:text-ink"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true">
                        <path d="M10 4v12M4 10h12" />
                      </svg>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="rounded-pill p-1.5 text-smoke transition-colors hover:text-ink"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
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

            {historyOpen ? (
              <div className="animate-fade-in max-h-[40vh] shrink-0 overflow-y-auto border-b border-mist bg-mist/30 px-6 py-4">
                <p className="section-label mb-2">Past conversations</p>
                {history.length === 0 ? (
                  <p className="text-[12px] text-pewter">Nothing yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {history.map((entry) => (
                      <li key={entry.id}>
                        <button
                          type="button"
                          onClick={() => void loadConversation(entry.id)}
                          className={cx(
                            "w-full rounded-small px-2 py-1.5 text-left transition-colors hover:bg-paper",
                            entry.id === conversationId && "bg-paper",
                          )}
                        >
                          <span className="block truncate text-[13px] text-ink">
                            {entry.title}
                          </span>
                          {entry.opportunity_title ? (
                            <span className="block truncate text-[11px] text-smoke">
                              about {entry.opportunity_title}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

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

                      {turn.content ? (
                        <RichText compact>{turn.content}</RichText>
                      ) : null}
                      {turn.streaming ? (
                        <span
                          className="ml-0.5 inline-block h-[15px] w-[2px] translate-y-[2px] animate-pulse bg-ember"
                          aria-hidden="true"
                        />
                      ) : null}

                      <div className="mt-2.5 flex flex-wrap items-center gap-3">
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
                              id={`source-${citation.position}`}
                              className="scroll-mt-4 rounded-card border border-mist px-3 py-2 transition-colors"
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

                {busy && stage ? (
                  <p className="flex items-center gap-2 text-[12px] text-smoke">
                    <span className="flex gap-0.5" aria-hidden="true">
                      <span className="h-1 w-1 animate-bounce rounded-pill bg-smoke [animation-delay:0ms]" />
                      <span className="h-1 w-1 animate-bounce rounded-pill bg-smoke [animation-delay:150ms]" />
                      <span className="h-1 w-1 animate-bounce rounded-pill bg-smoke [animation-delay:300ms]" />
                    </span>
                    {stageLabel(stage)}
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
                  onClick={() => setUseDocuments((value) => !value)}
                  aria-pressed={useDocuments}
                  title={
                    useDocuments
                      ? "Answers are grounded in your dossier"
                      : "Answering from general knowledge only"
                  }
                  className={cx(
                    "inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[11px] font-medium transition-colors",
                    useDocuments
                      ? "bg-char text-paper"
                      : "text-pewter ring-1 ring-inset ring-mist hover:ring-smoke",
                  )}
                >
                  <span
                    className={cx(
                      "h-2 w-2 rounded-pill ring-1",
                      useDocuments ? "bg-ember ring-ember" : "bg-transparent ring-smoke",
                    )}
                    aria-hidden="true"
                  />
                  Use my dossier
                </button>
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
                {busy ? (
                  <button
                    type="button"
                    onClick={() => {
                      abortRef.current?.();
                      abortRef.current = null;
                      setBusy(false);
                      setStage(null);
                      setTurns((current) =>
                        current.map((turn) =>
                          turn.streaming ? { ...turn, streaming: false } : turn,
                        ),
                      );
                    }}
                    className="h-11 shrink-0 rounded-button border border-mist px-4 text-[13px] font-medium text-pewter transition-colors hover:border-ink hover:text-ink"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    aria-label="Send"
                    className="h-11 shrink-0 rounded-button bg-char px-4 text-[13px] font-medium text-paper transition-colors hover:bg-ink disabled:bg-smoke"
                  >
                    Ask
                  </button>
                )}
              </form>
              <p className="mt-2 text-[10px] leading-relaxed text-smoke">
                {!useDocuments
                  ? "Your dossier is off, so answers come from general knowledge and cannot reference your own documents."
                  : web
                    ? "Web search costs noticeably more per question than reading your own documents."
                    : "Answers are drawn from your dossier and cite it."}
              </p>
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
