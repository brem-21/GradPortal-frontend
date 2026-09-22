"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Select } from "@/components/form";
import { SectionLabel, cx } from "@/components/ui";
import { KIND_HINTS, KIND_OPTIONS, formatBytes } from "@/lib/document-kinds";
import type { DocumentKind } from "@/types/ai";

const ACCEPT = ".pdf,.docx,.txt,.md";
const MAX_BYTES = 15 * 1024 * 1024;

interface Row {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "done" | "error";
  message?: string;
}

/**
 * Drag-and-drop upload.
 *
 * Files upload one at a time rather than in parallel: each one is parsed,
 * chunked and embedded server-side, and firing six at once just queues them
 * behind each other while making the progress display lie.
 */
export function Uploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<DocumentKind>("cv");
  const [dragging, setDragging] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  async function uploadOne(file: File, rowId: string) {
    if (file.size > MAX_BYTES) {
      setRows((current) =>
        current.map((row) =>
          row.id === rowId
            ? { ...row, status: "error", message: `Larger than the 15MB limit.` }
            : row,
        ),
      );
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: form,
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setRows((current) =>
          current.map((row) =>
            row.id === rowId
              ? { ...row, status: "error", message: payload.detail ?? "Upload failed." }
              : row,
          ),
        );
        return;
      }

      setRows((current) =>
        current.map((row) =>
          row.id === rowId
            ? {
                ...row,
                status: "done",
                message:
                  payload.warnings?.[0] ??
                  `Indexed into ${payload.document?.chunk_count ?? 0} searchable sections.`,
              }
            : row,
        ),
      );
      router.refresh();
    } catch {
      setRows((current) =>
        current.map((row) =>
          row.id === rowId
            ? { ...row, status: "error", message: "Network error during upload." }
            : row,
        ),
      );
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files).map((file) => ({
      file,
      row: {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        status: "uploading" as const,
      },
    }));
    setRows((current) => [...incoming.map((item) => item.row), ...current]);
    for (const item of incoming) {
      await uploadOne(item.file, item.row.id);
    }
  }

  return (
    <section className="mb-14">
      <SectionLabel>Upload</SectionLabel>
      <h2 className="heading mb-6">Add a document</h2>

      <div className="mb-5 max-w-[380px]">
        <label className="block">
          <span className="section-label block">What is this?</span>
          <Select
            value={kind}
            onChange={(event) => setKind(event.target.value as DocumentKind)}
          >
            {KIND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
        <p className="mt-2 text-[12px] leading-relaxed text-smoke">{KIND_HINTS[kind]}</p>
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
          void handleFiles(event.dataTransfer.files);
        }}
        className={cx(
          "rounded-card border border-dashed px-6 py-12 text-center transition-colors duration-200",
          dragging ? "border-ember bg-mist/50" : "border-smoke/50",
        )}
      >
        <p className="text-[15px] text-ink">Drop a file here</p>
        <p className="mt-1 text-[13px] text-pewter">PDF, DOCX, TXT or MD · up to 15MB</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-button bg-char px-4 py-[13px] text-[13px] font-medium text-paper transition-colors hover:bg-ink"
        >
          Choose a file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <p className="mt-5 text-[12px] leading-relaxed text-smoke">
          Scanned PDFs with no selectable text cannot be read — run OCR first, or
          upload the DOCX.
        </p>
      </div>

      {rows.length > 0 ? (
        <ul className="mt-5 space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-mist px-4 py-3"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-ink">{row.name}</span>
                <span className="text-[12px] text-smoke">
                  {formatBytes(row.size)}
                  {row.message ? ` · ${row.message}` : ""}
                </span>
              </span>
              <span
                className={cx(
                  "shrink-0 text-[12px]",
                  row.status === "done"
                    ? "text-pewter"
                    : row.status === "error"
                      ? "text-ember"
                      : "text-smoke",
                )}
              >
                {row.status === "uploading"
                  ? "Indexing…"
                  : row.status === "done"
                    ? "Indexed"
                    : "Failed"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
