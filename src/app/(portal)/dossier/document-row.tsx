"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteDocumentAction,
  reindexDocumentAction,
  retypeDocumentAction,
} from "@/lib/ai-actions";
import { Select } from "@/components/form";
import { useConfirm } from "@/components/confirm-dialog";
import { GhostButton, Tag, cx } from "@/components/ui";
import { KIND_OPTIONS, formatBytes, kindLabel } from "@/lib/document-kinds";
import type { AppDocument } from "@/types/ai";

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  indexed: { label: "Indexed", tone: "text-pewter" },
  pending: { label: "Queued", tone: "text-smoke" },
  processing: { label: "Indexing…", tone: "text-smoke" },
  failed: { label: "Failed", tone: "text-ember" },
};

export function DocumentRow({ document }: { document: AppDocument }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();

  const status = STATUS_COPY[document.status] ?? STATUS_COPY.pending;

  function run(fn: () => Promise<{ ok: boolean; message: string | null }>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.message);
      else router.refresh();
    });
  }

  return (
    <li className="hairline py-6 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="text-[18px] text-ink">{document.title ?? document.filename}</h3>
            <Tag tone="outline">{kindLabel(document.kind)}</Tag>
          </div>
          <p className="text-[12px] text-smoke">
            {document.filename} · {formatBytes(document.size_bytes)}
            {document.page_count ? ` · ${document.page_count} pages` : ""}
            {` · ${document.word_count.toLocaleString()} words`}
            {document.chunk_count
              ? ` · ${document.chunk_count} searchable sections`
              : ""}
          </p>
          <p className={cx("mt-2 text-[12px]", status.tone)}>{status.label}</p>
          {document.error ? (
            <p className="prose-column mt-1 text-[12px] leading-relaxed text-ember">
              {document.error}
            </p>
          ) : null}
          {error ? <p className="mt-2 text-[12px] text-ember">{error}</p> : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          <Select
            aria-label="Document type"
            defaultValue={document.kind}
            disabled={pending}
            onChange={(event) =>
              run(() => retypeDocumentAction(document.id, event.target.value))
            }
            className="mt-0 w-[190px]"
          >
            {KIND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <div className="flex items-center gap-4">
            {document.status === "failed" ? (
              <GhostButton
                type="button"
                disabled={pending}
                onClick={() => run(() => reindexDocumentAction(document.id))}
              >
                Retry →
              </GhostButton>
            ) : null}
            <GhostButton
              type="button"
              disabled={pending}
              onClick={async () => {
                const confirmed = await confirm({
                  title: "Delete this document?",
                  body: `"${document.title ?? document.filename}" and its ${document.chunk_count} indexed sections are removed. Counsel will no longer be able to answer from it, and past Committee reviews that cited it stay but cannot be re-run against it.`,
                  confirmLabel: "Delete",
                  tone: "danger",
                });
                if (confirmed) run(() => deleteDocumentAction(document.id));
              }}
              className="text-smoke"
            >
              Delete
            </GhostButton>
          </div>
        </div>
      </div>
    </li>
  );
}
