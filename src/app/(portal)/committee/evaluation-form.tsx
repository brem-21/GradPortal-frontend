"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { IDLE } from "@/lib/action-state";
import { startEvaluationAction } from "@/lib/ai-actions";
import { Field, FormMessage, Select, SubmitButton, TextInput } from "@/components/form";
import { Tag, cx } from "@/components/ui";
import { KIND_LABELS, kindLabel } from "@/lib/document-kinds";
import { FIELD_OPTIONS } from "@/lib/options";
import type { AppDocument, DocumentKind, Track } from "@/types/ai";

const TRACK_COPY: Record<Track, { label: string; blurb: string }> = {
  masters: {
    label: "Master's",
    blurb:
      "Read as a committee deciding whether you will cope with graduate coursework and be employable after. Technical preparation and career clarity carry the most weight.",
  },
  phd: {
    label: "PhD",
    blurb:
      "Read as a supervisor deciding whether to commit five years and funding. Research output, methodological depth and a real research question dominate.",
  },
};

/** What each committee expects to see in a file before it can judge it. */
const EXPECTED: Record<Track, DocumentKind[]> = {
  masters: ["cv", "sop", "transcript"],
  phd: ["cv", "sop", "research_proposal", "recommendation", "transcript"],
};

/**
 * Left is Master's, right is PhD. A segmented control rather than two cards:
 * the choice is binary, and two description cards pushed everything else below
 * the fold on a page whose real content is the review history.
 */
function TrackToggle({
  track,
  onChange,
}: {
  track: Track;
  onChange: (track: Track) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Which committee"
      className="relative inline-flex rounded-pill border border-mist bg-mist/40 p-1"
    >
      <span
        aria-hidden="true"
        className={cx(
          "absolute inset-y-1 w-[calc(50%-4px)] rounded-pill bg-ink transition-transform duration-300 ease-out",
          track === "phd" ? "translate-x-full" : "translate-x-0",
        )}
      />
      {(["masters", "phd"] as Track[]).map((value) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={track === value}
          onClick={() => onChange(value)}
          className={cx(
            "relative z-10 w-[104px] rounded-pill px-4 py-2 text-[13px] transition-colors duration-200",
            track === value ? "text-paper" : "text-pewter hover:text-ink",
          )}
        >
          {TRACK_COPY[value].label}
        </button>
      ))}
    </div>
  );
}

/**
 * Document picker as a dropdown, so the list does not take a screen of its own.
 * The trigger carries the count, which is the only part worth seeing at rest.
 */
function DocumentPicker({
  documents,
  selected,
  onToggle,
  missing,
}: {
  documents: AppDocument[];
  selected: string[];
  onToggle: (id: string) => void;
  missing: DocumentKind[];
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className={cx(
          "inline-flex items-center gap-2 rounded-pill border px-4 py-2 text-[13px] transition-colors",
          open ? "border-ink bg-mist text-ink" : "border-mist text-pewter hover:border-smoke hover:text-ink",
        )}
      >
        <span>
          {selected.length} of {documents.length} document
          {documents.length === 1 ? "" : "s"}
        </span>
        {missing.length > 0 ? (
          <span
            className="h-1.5 w-1.5 rounded-pill bg-ember"
            aria-label={`${missing.length} expected document types missing`}
          />
        ) : null}
        <span
          aria-hidden="true"
          className={cx("text-[9px] transition-transform duration-200", open && "rotate-180")}
        >
          ▼
        </span>
      </button>

      {open ? (
        <div className="animate-fade-up absolute right-0 top-full z-50 mt-2 w-[340px] overflow-hidden rounded-card border border-mist bg-paper">
          <div className="max-h-[300px] overflow-y-auto [scrollbar-width:thin]">
            {documents.map((document) => (
              <label
                key={document.id}
                className="flex cursor-pointer items-start gap-3 border-b border-mist px-4 py-3 transition-colors last:border-b-0 hover:bg-mist/40"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(document.id)}
                  onChange={() => onToggle(document.id)}
                  className="mt-1"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-ink">
                    {document.title ?? document.filename}
                  </span>
                  <span className="block text-[11px] text-pewter">
                    {kindLabel(document.kind)} ·{" "}
                    {document.word_count.toLocaleString()} words
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="border-t border-mist bg-mist/30 px-4 py-3">
            <p className="section-label mb-2">What this committee expects</p>
            {missing.length === 0 ? (
              <p className="text-[12px] leading-relaxed text-pewter">
                Everything expected is in your dossier.
              </p>
            ) : (
              <>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {missing.map((kind) => (
                    <Tag key={kind} tone="ember">
                      {KIND_LABELS[kind]}
                    </Tag>
                  ))}
                </div>
                <p className="text-[12px] leading-relaxed text-pewter">
                  The review still runs, and it will say what it could not judge.
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function EvaluationForm({ documents }: { documents: AppDocument[] }) {
  const router = useRouter();
  const [state, action] = useActionState(startEvaluationAction, IDLE as never);
  const [track, setTrack] = useState<Track>("masters");
  const [selected, setSelected] = useState<string[]>(documents.map((d) => d.id));

  const result = state as typeof IDLE & { runId?: string };

  useEffect(() => {
    if (result.ok && result.runId) {
      router.push(`/committee/${result.runId}`);
    }
  }, [result, router]);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  const present = new Set(
    documents.filter((d) => selected.includes(d.id)).map((d) => d.kind),
  );
  const missing = EXPECTED[track].filter((kind) => !present.has(kind));

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="track" value={track} />
      {selected.map((id) => (
        <input key={id} type="hidden" name="document_ids" value={id} />
      ))}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <TrackToggle track={track} onChange={setTrack} />
          <p
            key={track}
            className="animate-fade-up prose-column mt-3 text-[13px] leading-relaxed text-pewter"
          >
            {TRACK_COPY[track].blurb}
          </p>
        </div>
        <DocumentPicker
          documents={documents}
          selected={selected}
          onToggle={toggle}
          missing={missing}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Target field" hint="Sharpens the fit judgement.">
          <Select name="target_field" defaultValue="">
            <option value="">Not specified</option>
            {FIELD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Target programmes"
          hint="Naming them lets the reviewer judge programme-specific fit properly."
        >
          <TextInput
            name="target_programs"
            placeholder="ETH Zürich MSc CS, TU Delft, Edinburgh Informatics"
          />
        </Field>
      </div>

      <FormMessage state={result} />

      <div className="flex flex-wrap items-center gap-5">
        <SubmitButton pendingLabel="Reading your file… this takes up to a minute">
          Run the review
        </SubmitButton>
        <p className="text-[12px] text-smoke">
          Uses the reasoning model. Nothing is shared outside your account.
        </p>
      </div>
    </form>
  );
}
