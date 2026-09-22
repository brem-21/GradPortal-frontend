"use client";

import { useMemo, useState } from "react";
import { DocumentViewer, KindGlyph } from "@/components/document-viewer";
import { UploadDialog } from "@/components/upload-dialog";
import { NavIcon } from "@/components/nav-icon";
import { cx } from "@/components/ui";
import { formatBytes, kindLabel } from "@/lib/document-kinds";
import type { AppDocument, DocumentKind } from "@/types/ai";

/**
 * The document kinds a graduate application is normally built from, in the
 * order a committee reads them. Showing the whole set — present or not — turns
 * the dossier into a checklist, which is the question an applicant actually
 * has ("what am I still missing?") rather than the one a plain list answers
 * ("what have I uploaded?").
 */
const EXPECTED: { kind: DocumentKind; short: string }[] = [
  { kind: "cv", short: "CV" },
  { kind: "sop", short: "Statement" },
  { kind: "motivation_letter", short: "Motivation" },
  { kind: "recommendation", short: "References" },
  { kind: "transcript", short: "Transcript" },
  { kind: "research_proposal", short: "Proposal" },
];

function StatusDot({ status }: { status: string }) {
  const tone =
    status === "indexed"
      ? "bg-pine"
      : status === "failed"
        ? "bg-ember"
        : "bg-smoke animate-pulse";
  return (
    <span
      className={cx("h-1.5 w-1.5 shrink-0 rounded-pill", tone)}
      aria-label={status}
      role="img"
    />
  );
}

export function DossierBoard({
  documents,
  driveConfigured,
}: {
  documents: AppDocument[];
  driveConfigured: boolean;
}) {
  const [filter, setFilter] = useState<DocumentKind | "all">("all");
  const [viewing, setViewing] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const byKind = useMemo(() => {
    const map = new Map<string, AppDocument[]>();
    for (const document of documents) {
      map.set(document.kind, [...(map.get(document.kind) ?? []), document]);
    }
    return map;
  }, [documents]);

  const visible = useMemo(
    () => (filter === "all" ? documents : documents.filter((d) => d.kind === filter)),
    [documents, filter],
  );

  const present = EXPECTED.filter(({ kind }) => byKind.has(kind)).length;
  const indexed = documents.filter((d) => d.status === "indexed").length;
  const words = documents.reduce((total, d) => total + d.word_count, 0);

  const index = visible.findIndex((d) => d.id === viewing);
  const neighbours = {
    previous: index > 0 ? visible[index - 1] : null,
    next: index >= 0 && index < visible.length - 1 ? visible[index + 1] : null,
  };

  return (
    <>
      {/* Completeness checklist — the whole expected set at a glance, above
          the fold, with the gaps as the clickable things. */}
      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <p className="section-label">
            {present} of {EXPECTED.length} document types · {indexed} indexed ·{" "}
            {words.toLocaleString()} words searchable
          </p>
          {documents.length > 0 ? (
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cx(
                "text-[12px] transition-colors",
                filter === "all" ? "text-smoke" : "text-ember hover:underline",
              )}
            >
              {filter === "all" ? "Showing all" : "Clear filter"}
            </button>
          ) : null}
        </div>

        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {EXPECTED.map(({ kind, short }) => {
            const held = byKind.get(kind) ?? [];
            const has = held.length > 0;
            const active = filter === kind;
            return (
              <li key={kind}>
                <button
                  type="button"
                  onClick={() => (has ? setFilter(active ? "all" : kind) : setUploadOpen(true))}
                  title={has ? `${held.length} ${kindLabel(kind)}` : `Add a ${kindLabel(kind)}`}
                  className={cx(
                    "group flex w-full flex-col items-start gap-1.5 rounded-card border p-3 text-left transition-colors",
                    active
                      ? "border-ink bg-mist"
                      : has
                        ? "border-mist hover:border-smoke"
                        : "border-dashed border-smoke/40 hover:border-ember",
                  )}
                >
                  <span className="flex w-full items-center justify-between">
                    <span
                      className={cx(
                        "text-[12px]",
                        has ? "text-ink" : "text-smoke",
                      )}
                    >
                      {short}
                    </span>
                    {has ? (
                      <span className="text-[11px] text-pewter">{held.length}</span>
                    ) : (
                      <NavIcon
                        name="plus"
                        className="h-3.5 w-3.5 text-smoke transition-colors group-hover:text-ember"
                      />
                    )}
                  </span>
                  <span
                    className={cx(
                      "h-[2px] w-full rounded-pill",
                      has ? "bg-pine" : "bg-mist",
                    )}
                    aria-hidden="true"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Compact grid. Three per row on a wide screen, so a full dossier is
          visible without scrolling instead of one tall row at a time. */}
      {visible.length === 0 ? (
        <div className="rounded-card border border-dashed border-smoke/40 px-6 py-14 text-center">
          <p className="text-[15px] text-ink">
            {documents.length === 0
              ? "Your dossier is empty"
              : `No ${kindLabel(filter as string)} yet`}
          </p>
          <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-relaxed text-pewter">
            {documents.length === 0
              ? "Start with your CV and statement of purpose — those two carry most of the weight in a committee's reading."
              : "Add one, and it becomes searchable by Counsel and readable by the Committee."}
          </p>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="mt-5 rounded-button bg-char px-4 py-[13px] text-[13px] font-medium text-paper transition-colors hover:bg-ink"
          >
            Add documents
          </button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((document) => (
            <li key={document.id}>
              <button
                type="button"
                onClick={() => setViewing(document.id)}
                className={cx(
                  "group flex w-full items-start gap-3 rounded-card border border-mist p-3.5 text-left",
                  "transition-colors hover:border-ink",
                  document.status === "failed" && "border-coral/50",
                )}
              >
                <KindGlyph kind={document.kind} />

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <StatusDot status={document.status} />
                    <span className="truncate text-[14px] leading-snug text-ink">
                      {document.title ?? document.filename}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-[11px] text-smoke">
                    {kindLabel(document.kind)} · {formatBytes(document.size_bytes)}
                    {document.page_count ? ` · ${document.page_count}p` : ""}
                    {` · ${document.word_count.toLocaleString()} words`}
                  </span>
                  {document.status === "failed" ? (
                    <span className="mt-1 block truncate text-[11px] text-ember">
                      {document.error ?? "Indexing failed"}
                    </span>
                  ) : null}
                </span>

                <span className="shrink-0 self-center text-smoke transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-ink">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {viewing ? (
        <DocumentViewer
          documentId={viewing}
          onClose={() => setViewing(null)}
          onJump={setViewing}
          neighbours={neighbours}
        />
      ) : null}

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        driveConfigured={driveConfigured}
      />
    </>
  );
}
