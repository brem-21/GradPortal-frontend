"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NavIcon } from "./nav-icon";
import { useProgress } from "./progress-rail";
import { cx } from "./ui";
import { KIND_HINTS, KIND_OPTIONS, formatBytes } from "@/lib/document-kinds";
import type { DocumentKind } from "@/types/ai";

const ACCEPT = ".pdf,.docx,.txt,.md";
const MAX_BYTES = 15 * 1024 * 1024;

type Stage = "choose" | "review" | "uploading" | "done";

interface Pending {
  id: string;
  file: File;
  kind: DocumentKind;
  status: "ready" | "uploading" | "done" | "error";
  message?: string;
}

/** Guess the document kind from the filename, so most files need no correction. */
function guessKind(filename: string): DocumentKind {
  const name = filename.toLowerCase();
  if (/\b(cv|resume|résumé)\b/.test(name)) return "cv";
  if (/\b(sop|statement[-_ ]?of[-_ ]?purpose|personal[-_ ]?statement)\b/.test(name)) return "sop";
  if (/\b(motivation|cover[-_ ]?letter)\b/.test(name)) return "motivation_letter";
  if (/\b(recommendation|reference|lor|referee)\b/.test(name)) return "recommendation";
  if (/\b(transcript|grades|marksheet|academic[-_ ]?record)\b/.test(name)) return "transcript";
  if (/\b(proposal|research[-_ ]?plan)\b/.test(name)) return "research_proposal";
  return "other";
}

function FileGlyph({ file }: { file: File }) {
  const extension = (file.name.split(".").pop() ?? "").toUpperCase().slice(0, 4);
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-small bg-mist text-[10px] font-medium text-pewter">
      {extension || "FILE"}
    </span>
  );
}

/**
 * Two-step upload: choose a source, then review before anything is sent.
 *
 * The review step exists because the document *kind* drives which rubric the
 * committee reads it against — a CV scored as a statement of purpose produces
 * confident nonsense. Guessing from the filename gets it right most of the
 * time; showing the guess is what makes the rest correctable.
 */
export function UploadDialog({
  open,
  onClose,
  driveConfigured,
}: {
  open: boolean;
  onClose: () => void;
  driveConfigured: boolean;
}) {
  const router = useRouter();
  const progress = useProgress();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("choose");
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStage("choose");
    setPending([]);
    setNotice(null);
    setDragging(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && stage !== "uploading") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose, stage]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  function accept(files: FileList | File[] | null) {
    if (!files) return;
    const incoming = Array.from(files);
    if (incoming.length === 0) return;

    const rejected: string[] = [];
    const accepted = incoming.filter((file) => {
      const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
      if (!ACCEPT.includes(extension)) {
        rejected.push(`${file.name} — unsupported type`);
        return false;
      }
      if (file.size > MAX_BYTES) {
        rejected.push(`${file.name} — over 15MB`);
        return false;
      }
      return true;
    });

    setNotice(rejected.length > 0 ? rejected.join(" · ") : null);
    if (accepted.length === 0) return;

    setPending((current) => [
      ...current,
      ...accepted.map((file) => ({
        id: `${file.name}-${file.size}-${Math.random()}`,
        file,
        kind: guessKind(file.name),
        status: "ready" as const,
      })),
    ]);
    setStage("review");
  }

  async function finalise() {
    setStage("uploading");
    const task = progress.start(`Uploading ${pending.length} document(s)`);
    let failures = 0;

    for (const entry of pending) {
      setPending((current) =>
        current.map((row) =>
          row.id === entry.id ? { ...row, status: "uploading" } : row,
        ),
      );

      const form = new FormData();
      form.append("file", entry.file);
      form.append("kind", entry.kind);

      try {
        const response = await fetch("/api/documents/upload", { method: "POST", body: form });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          failures += 1;
          setPending((current) =>
            current.map((row) =>
              row.id === entry.id
                ? { ...row, status: "error", message: payload.detail ?? "Upload failed." }
                : row,
            ),
          );
        } else {
          setPending((current) =>
            current.map((row) =>
              row.id === entry.id
                ? {
                    ...row,
                    status: "done",
                    message:
                      payload.warnings?.[0] ??
                      `Indexed into ${payload.document?.chunk_count ?? 0} sections`,
                  }
                : row,
            ),
          );
        }
      } catch {
        failures += 1;
        setPending((current) =>
          current.map((row) =>
            row.id === entry.id
              ? { ...row, status: "error", message: "Network error." }
              : row,
          ),
        );
      }
    }

    if (failures > 0) task.fail(`${failures} upload(s) failed`);
    else task.done();

    setStage("done");
    router.refresh();
  }

  if (!open) return null;

  const uploading = stage === "uploading";
  const succeeded = pending.filter((entry) => entry.status === "done").length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add documents"
      className="fixed inset-0 z-[150] flex items-center justify-center px-4 py-8"
    >
      <button
        type="button"
        aria-label="Close"
        disabled={uploading}
        onClick={onClose}
        className="animate-scrim-in absolute inset-0 cursor-default bg-midnight/50 backdrop-blur-lg disabled:cursor-wait"
      />

      <div className="animate-fade-up relative flex max-h-[86vh] w-full max-w-[560px] flex-col overflow-hidden rounded-card bg-paper">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-mist px-7 py-5">
          <div>
            <p className="section-label">
              {stage === "choose"
                ? "Step 1 of 2"
                : stage === "review"
                  ? "Step 2 of 2"
                  : stage === "uploading"
                    ? "Uploading"
                    : "Done"}
            </p>
            <h2 className="text-[22px] font-light tracking-[-0.44px]">
              {stage === "choose"
                ? "Add to your dossier"
                : stage === "review"
                  ? "Check before uploading"
                  : stage === "uploading"
                    ? "Indexing your documents"
                    : `${succeeded} of ${pending.length} uploaded`}
            </h2>
          </div>
          {!uploading ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 text-smoke transition-colors hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6">
          {stage === "choose" ? (
            <>
              <p className="mb-5 text-[13px] leading-relaxed text-pewter">
                Where are your files? Nothing uploads until you have reviewed them.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="group flex flex-col items-start gap-3 rounded-card border border-mist p-5 text-left transition-colors hover:border-ink"
                >
                  <NavIcon name="folder" className="text-ink" />
                  <span>
                    <span className="block text-[15px] text-ink">This computer</span>
                    <span className="mt-1 block text-[12px] leading-relaxed text-pewter">
                      Browse, or drag files onto the area below
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  disabled={!driveConfigured}
                  onClick={() => setNotice("Google Drive is not connected yet.")}
                  className={cx(
                    "group flex flex-col items-start gap-3 rounded-card border p-5 text-left transition-colors",
                    driveConfigured
                      ? "border-mist hover:border-ink"
                      : "cursor-not-allowed border-mist opacity-55",
                  )}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#0066DA" d="m4.2 16.5 1.2 2.1c.25.44.6.78 1.02 1.02l4.28-7.42H3.12c0 .48.12.96.37 1.4z" />
                    <path fill="#00AC47" d="M12 8.2 9.86 4.5 7.72.8c-.42.24-.78.58-1.02 1.02L1.5 10.9c-.24.43-.37.91-.37 1.4h6.86z" transform="translate(2 3.3)" />
                    <path fill="#EA4335" d="M17.58 19.62c.42-.24.78-.58 1.02-1.02l.5-.86 2.4-4.16c.24-.43.37-.91.37-1.4h-7.58l1.6 3.16z" />
                    <path fill="#00832D" d="M12 8.2 15.44 2.3c-.42-.24-.9-.37-1.4-.37H9.96c-.5 0-.98.15-1.4.37z" transform="translate(0 1.7)" />
                    <path fill="#2684FC" d="M16.28 12.2H7.72l-4.28 7.42c.42.24.9.37 1.4.37h14.32c.5 0 .98-.15 1.4-.37z" />
                    <path fill="#FFBA00" d="M20.44 8.7 17.9 4.3c-.24-.44-.6-.78-1.02-1.02L13.44 9.9l4.28 7.42c.42-.24.78-.58 1.02-1.02l1.7-2.94c.24-.43.37-.91.37-1.4 0-.49-.13-.97-.37-1.4z" />
                  </svg>
                  <span>
                    <span className="block text-[15px] text-ink">Google Drive</span>
                    <span className="mt-1 block text-[12px] leading-relaxed text-pewter">
                      {driveConfigured
                        ? "Pick a file from your Drive"
                        : "Needs a Google API key and Drive scope — see the README"}
                    </span>
                  </span>
                </button>
              </div>

              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  accept(event.dataTransfer.files);
                }}
                className={cx(
                  "mt-4 rounded-card border border-dashed px-6 py-10 text-center transition-colors",
                  dragging ? "border-ember bg-mist/50" : "border-smoke/40",
                )}
              >
                <p className="text-[14px] text-ink">Drop files here</p>
                <p className="mt-1 text-[12px] text-pewter">
                  PDF, DOCX, TXT or MD · up to 15MB each
                </p>
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-smoke">
                A scanned PDF with no selectable text cannot be read — run OCR first,
                or upload the DOCX.
              </p>
            </>
          ) : null}

          {stage !== "choose" ? (
            <ul className="space-y-2.5">
              {pending.map((entry) => (
                <li
                  key={entry.id}
                  className={cx(
                    "flex items-start gap-4 rounded-card border p-4 transition-colors",
                    entry.status === "error"
                      ? "border-coral/50"
                      : entry.status === "done"
                        ? "border-pine/40"
                        : "border-mist",
                  )}
                >
                  <FileGlyph file={entry.file} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] text-ink">{entry.file.name}</p>
                    <p className="mt-0.5 text-[11px] text-smoke">
                      {formatBytes(entry.file.size)}
                      {entry.message ? ` · ${entry.message}` : ""}
                    </p>

                    {entry.status === "ready" ? (
                      <>
                        <select
                          value={entry.kind}
                          onChange={(event) =>
                            setPending((current) =>
                              current.map((row) =>
                                row.id === entry.id
                                  ? { ...row, kind: event.target.value as DocumentKind }
                                  : row,
                              ),
                            )
                          }
                          className="mt-2.5 w-full rounded-small border border-mist bg-paper px-2.5 py-1.5 text-[13px] focus:border-ink focus:outline-none"
                        >
                          {KIND_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1.5 text-[11px] leading-relaxed text-smoke">
                          {KIND_HINTS[entry.kind]}
                        </p>
                      </>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={cx(
                        "text-[11px]",
                        entry.status === "error"
                          ? "text-ember"
                          : entry.status === "done"
                            ? "text-pine"
                            : "text-smoke",
                      )}
                    >
                      {entry.status === "uploading"
                        ? "Indexing…"
                        : entry.status === "done"
                          ? "Done"
                          : entry.status === "error"
                            ? "Failed"
                            : ""}
                    </span>
                    {entry.status === "ready" ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPending((current) =>
                            current.filter((row) => row.id !== entry.id),
                          )
                        }
                        aria-label={`Remove ${entry.file.name}`}
                        className="text-smoke transition-colors hover:text-ember"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                          <path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {notice ? (
            <p className="mt-4 rounded-card border border-ember/40 px-3 py-2 text-[12px] text-ink">
              {notice}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-mist px-7 py-4">
          {stage === "review" ? (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-[13px] text-pewter transition-colors hover:text-ink"
              >
                Add more
              </button>
              <button
                type="button"
                onClick={finalise}
                disabled={pending.length === 0}
                className="rounded-button bg-char px-5 py-[13px] text-[13px] font-medium text-paper transition-colors hover:bg-ink disabled:bg-smoke"
              >
                Upload {pending.length} document{pending.length === 1 ? "" : "s"}
              </button>
            </>
          ) : stage === "uploading" ? (
            <p className="text-[13px] text-smoke">
              Parsing, chunking and embedding — this can take a moment per file.
            </p>
          ) : stage === "done" ? (
            <>
              <button
                type="button"
                onClick={reset}
                className="text-[13px] text-pewter transition-colors hover:text-ink"
              >
                Add more
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-button bg-char px-5 py-[13px] text-[13px] font-medium text-paper transition-colors hover:bg-ink"
              >
                Done
              </button>
            </>
          ) : (
            <p className="text-[12px] text-smoke">Nothing is uploaded until you confirm.</p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        onChange={(event) => {
          accept(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}

/** The button that opens it. */
export function UploadButton({ driveConfigured }: { driveConfigured: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-button bg-char px-5 py-[15px] text-[13px] font-medium text-paper transition-colors hover:bg-ink"
      >
        <NavIcon name="plus" className="h-4 w-4" />
        Add documents
      </button>
      <UploadDialog open={open} onClose={() => setOpen(false)} driveConfigured={driveConfigured} />
    </>
  );
}
