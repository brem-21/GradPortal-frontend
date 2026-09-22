"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { IDLE } from "@/lib/action-state";
import { startEvaluationAction } from "@/lib/ai-actions";
import { Field, FormMessage, Select, SubmitButton, TextInput } from "@/components/form";
import { Hairline, SectionLabel, Tag, cx } from "@/components/ui";
import { kindLabel } from "@/lib/document-kinds";
import { FIELD_OPTIONS } from "@/lib/options";
import type { AppDocument, Track } from "@/types/ai";

const TRACK_COPY: Record<Track, { label: string; blurb: string }> = {
  masters: {
    label: "Master's",
    blurb:
      "Read as a committee deciding whether you will cope with graduate coursework and be employable after. Technical preparation and career clarity carry the most weight; research output is a bonus.",
  },
  phd: {
    label: "PhD",
    blurb:
      "Read as a supervisor deciding whether to commit five years and funding. Research output, methodological depth and a real research question dominate. Coursework is a floor, not a differentiator.",
  },
};

export function EvaluationForm({ documents }: { documents: AppDocument[] }) {
  const router = useRouter();
  const [state, action] = useActionState(startEvaluationAction, IDLE as never);
  const [track, setTrack] = useState<Track>("masters");
  const [selected, setSelected] = useState<string[]>(documents.map((d) => d.id));

  const result = state as typeof IDLE & { runId?: string };

  useEffect(() => {
    if (result.ok && result.runId) {
      router.push(`/evaluate/${result.runId}`);
    }
  }, [result, router]);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  return (
    <form action={action} className="space-y-10">
      <input type="hidden" name="track" value={track} />
      {selected.map((id) => (
        <input key={id} type="hidden" name="document_ids" value={id} />
      ))}

      <section>
        <SectionLabel>Which committee</SectionLabel>
        <h2 className="heading mb-5">Master&rsquo;s or PhD?</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(TRACK_COPY) as Track[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTrack(value)}
              aria-pressed={track === value}
              className={cx(
                "rounded-card border p-5 text-left transition-colors duration-200",
                track === value
                  ? "border-ink bg-mist"
                  : "border-mist hover:border-smoke",
              )}
            >
              <span className="flex items-center justify-between">
                <span className="text-[18px] text-ink">{TRACK_COPY[value].label}</span>
                {track === value ? <Tag tone="ember">Selected</Tag> : null}
              </span>
              <span className="prose-column mt-3 block text-[13px] leading-relaxed text-pewter">
                {TRACK_COPY[value].blurb}
              </span>
            </button>
          ))}
        </div>
      </section>

      <Hairline />

      <section>
        <SectionLabel>What to read</SectionLabel>
        <h2 className="heading mb-5">Documents</h2>
        <ul className="space-y-2">
          {documents.map((document) => (
            <li key={document.id}>
              <label
                className={cx(
                  "flex cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors",
                  selected.includes(document.id)
                    ? "border-ink"
                    : "border-mist hover:border-smoke",
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(document.id)}
                  onChange={() => toggle(document.id)}
                  className="mt-1"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] text-ink">
                    {document.title ?? document.filename}
                  </span>
                  <span className="block text-[12px] text-pewter">
                    {kindLabel(document.kind)} · {document.word_count.toLocaleString()} words
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-smoke">
          {selected.length} of {documents.length} selected. Each is read on its own,
          then the whole file is read together for contradictions and gaps.
        </p>
      </section>

      <Hairline />

      <section className="grid gap-6 md:grid-cols-2">
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
      </section>

      <FormMessage state={result} />

      <div className="flex flex-wrap items-center gap-6">
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
