"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckboxPills, Select, TextInput } from "@/components/form";
import { GhostButton, Hairline, cx } from "@/components/ui";
import {
  DEGREE_OPTIONS,
  FIELD_OPTIONS,
  FUNDING_OPTIONS,
  REGION_OPTIONS,
  TYPE_OPTIONS,
} from "@/lib/options";
import type { Facets } from "@/types/api";

const SORTS = [
  { value: "deadline", label: "Deadline (soonest)" },
  { value: "newest", label: "Recently added" },
  { value: "relevance", label: "Best match for me" },
];

/**
 * Filters drive the URL, not local state, so a filtered view is shareable and
 * the back button behaves. Submitting rebuilds the query string and navigates.
 */
export function Filters({ facets }: { facets: Facets }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const current = (key: string) => params.getAll(key);
  const activeCount =
    [
      "opportunity_types",
      "fields_of_study",
      "degree_levels",
      "regions",
      "countries",
      "funding_types",
    ].reduce((total, key) => total + params.getAll(key).length, 0) +
    (params.get("has_contact") ? 1 : 0) +
    (params.get("open_to_international") ? 1 : 0);

  function apply(form: FormData) {
    const next = new URLSearchParams();
    for (const [key, value] of form.entries()) {
      const text = String(value).trim();
      if (text) next.append(key, text);
    }
    startTransition(() => router.push(`/opportunities?${next.toString()}`));
  }

  function reset() {
    startTransition(() => router.push("/opportunities"));
  }

  const countryOptions = facets.countries
    .filter((c) => c.value)
    .slice(0, 24)
    .map((c) => ({ value: c.value, label: c.value, count: c.count }));

  return (
    <form action={apply} className="mb-10">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <TextInput
            name="q"
            defaultValue={params.get("q") ?? ""}
            placeholder="Search titles, organisations, descriptions…"
            aria-label="Search opportunities"
            className="mt-0"
          />
        </div>
        <Select
          name="sort"
          defaultValue={params.get("sort") ?? "deadline"}
          aria-label="Sort"
          className="mt-0 w-auto min-w-[190px]"
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </Select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-button bg-char px-4 py-[13px] text-[13px] font-medium leading-none text-paper transition-colors hover:bg-ink disabled:bg-smoke"
        >
          {pending ? "Loading…" : "Apply"}
        </button>
        <GhostButton type="button" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide filters" : "Filters"}
          {activeCount > 0 ? (
            <span className="ml-1 inline-flex min-w-[18px] items-center justify-center rounded-pill bg-ember px-1.5 py-0.5 text-[10px] leading-none text-paper">
              {activeCount}
            </span>
          ) : null}
        </GhostButton>
        {activeCount > 0 ? (
          <GhostButton type="button" onClick={reset} className="text-smoke">
            Clear
          </GhostButton>
        ) : null}
      </div>

      <div className={cx("mt-8 space-y-7", open ? "block" : "hidden")}>
        <Hairline />
        <div>
          <p className="section-label">Region</p>
          <CheckboxPills
            name="regions"
            options={REGION_OPTIONS.map((option) => ({
              ...option,
              count: facets.regions?.find((f) => f.value === option.value)?.count ?? null,
            }))}
            defaultValues={current("regions")}
          />
        </div>
        <div>
          <p className="section-label">Type</p>
          <CheckboxPills
            name="opportunity_types"
            options={TYPE_OPTIONS.map((o) => ({
              ...o,
              count: facets.opportunity_types.find((f) => f.value === o.value)?.count ?? null,
            }))}
            defaultValues={current("opportunity_types")}
          />
        </div>
        <div>
          <p className="section-label">Field</p>
          <CheckboxPills
            name="fields_of_study"
            options={FIELD_OPTIONS.map((o) => ({
              ...o,
              count: facets.fields_of_study.find((f) => f.value === o.value)?.count ?? null,
            }))}
            defaultValues={current("fields_of_study")}
          />
        </div>
        <div>
          <p className="section-label">Degree level</p>
          <CheckboxPills
            name="degree_levels"
            options={DEGREE_OPTIONS}
            defaultValues={current("degree_levels")}
          />
        </div>
        <div>
          <p className="section-label">Funding</p>
          <CheckboxPills
            name="funding_types"
            options={FUNDING_OPTIONS}
            defaultValues={current("funding_types")}
          />
        </div>
        {countryOptions.length > 0 ? (
          <div>
            <p className="section-label">Specific country</p>
            <CheckboxPills
              name="countries"
              options={countryOptions}
              defaultValues={current("countries")}
            />
          </div>
        ) : null}
        <div>
          <p className="section-label">Only show</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="cursor-pointer">
              <input
                type="checkbox"
                name="has_contact"
                value="true"
                defaultChecked={params.get("has_contact") === "true"}
                className="peer sr-only"
              />
              <span className="inline-flex rounded-pill px-[14px] py-[8px] text-[12px] font-medium leading-none text-pewter ring-1 ring-inset ring-mist transition-colors peer-checked:bg-char peer-checked:text-paper peer-checked:ring-char">
                With a contact email
              </span>
            </label>
            <label className="cursor-pointer">
              <input
                type="checkbox"
                name="open_to_international"
                value="true"
                defaultChecked={params.get("open_to_international") === "true"}
                className="peer sr-only"
              />
              <span className="inline-flex rounded-pill px-[14px] py-[8px] text-[12px] font-medium leading-none text-pewter ring-1 ring-inset ring-mist transition-colors peer-checked:bg-char peer-checked:text-paper peer-checked:ring-char">
                Open to international students
              </span>
            </label>
            <label className="cursor-pointer">
              <input
                type="checkbox"
                name="include_expired"
                value="true"
                defaultChecked={params.get("include_expired") === "true"}
                className="peer sr-only"
              />
              <span className="inline-flex rounded-pill px-[14px] py-[8px] text-[12px] font-medium leading-none text-pewter ring-1 ring-inset ring-mist transition-colors peer-checked:bg-char peer-checked:text-paper peer-checked:ring-char">
                Include closed
              </span>
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
