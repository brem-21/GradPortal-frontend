"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteDocumentAction,
  reindexDocumentAction,
  retypeDocumentAction,
} from "@/lib/ai-actions";
import { useConfirm } from "./confirm-dialog";
import { NavIcon } from "./nav-icon";
import { GhostButton, Tag, cx } from "./ui";
import { KIND_HINTS, KIND_OPTIONS, formatBytes, kindLabel } from "@/lib/document-kinds";
import type { AppDocument, DocumentKind } from "@/types/ai";

interface Loaded extends AppDocument {
  extracted_text: string;
}

/**
 * Read a document without leaving the dossier.
 *
 * Opens as a right-hand drawer rather than a page, so the list stays in place
 * and moving between documents costs one click instead of a navigation and a
 * scroll back to where you were.
 */
export function DocumentViewer({
  documentId,
  onClose,
  onJump,
  neighbours,
}: {
  documentId: string;
  onClose: () => void;
  onJump: (id: string) => void;
  neighbours: { previous: AppDocument | null; next: AppDocument | null };
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [document_, setDocument] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/documents/${documentId}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(response)))
      .then((payload) => {
        if (!cancelled) setDocument(payload);
      })
      .catch(() => {
        if (!cancelled) setError("That document could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      // Arrow keys move between documents, so a whole dossier can be reviewed
      // without returning to the grid.
      if (event.key === "ArrowLeft" && neighbours.previous) onJump(neighbours.previous.id);
      if (event.key === "ArrowRight" && neighbours.next) onJump(neighbours.next.id);
    };
    window.addEventListener("keydown", onKey);
    const previous = window.document.body.style.overflow;
    window.document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      window.document.body.style.overflow = previous;
    };
  }, [onClose, onJump, neighbours]);

  async function run(fn: () => Promise<{ ok: boolean; message: string | null }>) {
    setBusy(true);
    setError(null);
    const result = await fn();
    setBusy(false);
    if (!result.ok) setError(result.message);
    else router.refresh();
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close document"
        onClick={onClose}
        className="animate-scrim-in fixed inset-0 z-[130] cursor-default bg-midnight/40 backdrop-blur-sm"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={document_?.title ?? "Document"}
        className="animate-slide-in-right fixed inset-y-0 right-0 z-[140] flex w-full max-w-[640px] flex-col border-l border-mist bg-paper"
      >
        <header className="shrink-0 border-b border-mist px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Tag tone="outline">{kindLabel(document_?.kind ?? "other")}</Tag>
                {document_?.status === "indexed" ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-pewter">
                    <span className="h-1.5 w-1.5 rounded-pill bg-pine" aria-hidden="true" />
                    Indexed
                  </span>
                ) : document_?.status === "failed" ? (
                  <span className="text-[11px] text-ember">Failed</span>
                ) : null}
              </div>
              <h2 className="truncate text-[20px] font-light tracking-[-0.4px] text-ink">
                {document_?.title ?? document_?.filename ?? "Loading…"}
              </h2>
              {document_ ? (
                <p className="mt-0.5 text-[11px] text-smoke">
                  {document_.filename} · {formatBytes(document_.size_bytes)}
                  {document_.page_count ? ` · ${document_.page_count} pages` : ""}
                  {` · ${document_.word_count.toLocaleString()} words`}
                  {document_.chunk_count ? ` · ${document_.chunk_count} sections` : ""}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={!neighbours.previous}
                onClick={() => neighbours.previous && onJump(neighbours.previous.id)}
                aria-label="Previous document"
                className="rounded-pill p-1.5 text-smoke transition-colors hover:text-ink disabled:opacity-25"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M10 3.5 5.5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </button>
              <button
                type="button"
                disabled={!neighbours.next}
                onClick={() => neighbours.next && onJump(neighbours.next.id)}
                aria-label="Next document"
                className="rounded-pill p-1.5 text-smoke transition-colors hover:text-ink disabled:opacity-25"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-pill p-1.5 text-smoke transition-colors hover:text-ink"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* The text itself — the reason for opening this at all. */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="space-y-2.5" aria-hidden="true">
              {[92, 78, 88, 64, 84, 70, 90, 58].map((width, index) => (
                <div
                  key={index}
                  className="h-3 animate-pulse rounded-small bg-mist"
                  style={{ width: `${width}%` }}
                />
              ))}
            </div>
          ) : error ? (
            <p className="text-[13px] text-ember">{error}</p>
          ) : document_ ? (
            <pre className="whitespace-pre-wrap font-sans text-[13px] leading-[1.7] text-ink">
              {document_.extracted_text || "No text was extracted from this file."}
            </pre>
          ) : null}
        </div>

        <footer className="shrink-0 border-t border-mist px-6 py-4">
          {document_?.error ? (
            <p className="mb-3 text-[12px] leading-relaxed text-ember">{document_.error}</p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-2">
              <span className="text-[11px] text-smoke">Type</span>
              <select
                value={document_?.kind ?? "other"}
                disabled={busy || !document_}
                onChange={(event) =>
                  run(() => retypeDocumentAction(documentId, event.target.value))
                }
                className="rounded-small border border-mist bg-paper px-2 py-1.5 text-[12px] focus:border-ink focus:outline-none"
              >
                {KIND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-4">
              {document_?.status === "failed" ? (
                <GhostButton
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => reindexDocumentAction(documentId))}
                >
                  Retry indexing →
                </GhostButton>
              ) : null}
              <GhostButton
                type="button"
                disabled={busy}
                className="text-smoke"
                onClick={async () => {
                  const confirmed = await confirm({
                    title: "Delete this document?",
                    body: `"${document_?.title ?? "This document"}" and its ${document_?.chunk_count ?? 0} indexed sections are removed. Counsel will no longer answer from it.`,
                    confirmLabel: "Delete",
                    tone: "danger",
                  });
                  if (!confirmed) return;
                  const result = await deleteDocumentAction(documentId);
                  if (result.ok) {
                    onClose();
                    router.refresh();
                  } else {
                    setError(result.message);
                  }
                }}
              >
                Delete
              </GhostButton>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-smoke">
            {KIND_HINTS[(document_?.kind ?? "other") as DocumentKind]}
          </p>
        </footer>
      </aside>
    </>
  );
}

/** Small icon used on the compact cards. */
export function KindGlyph({ kind }: { kind: string }) {
  const icon =
    kind === "cv"
      ? "user"
      : kind === "sop" || kind === "motivation_letter"
        ? "message"
        : kind === "recommendation"
          ? "quote"
          : kind === "transcript"
            ? "folder"
            : kind === "research_proposal"
              ? "gavel"
              : "folder";
  return (
    <span
      className={cx(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-small bg-mist text-pewter",
      )}
    >
      <NavIcon name={icon} className="h-4 w-4" />
    </span>
  );
}
