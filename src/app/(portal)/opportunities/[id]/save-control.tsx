"use client";

import { useState, useTransition } from "react";
import { saveOpportunityAction, unsaveOpportunityAction } from "@/lib/actions";
import { APPLICATION_STATUS_OPTIONS } from "@/lib/options";
import { Select } from "@/components/form";
import { GhostButton } from "@/components/ui";
import type { ApplicationStatus } from "@/types/api";

export function SaveControl({
  opportunityId,
  isSaved,
  savedStatus,
}: {
  opportunityId: string;
  isSaved: boolean;
  savedStatus: ApplicationStatus | null;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(isSaved);
  const [status, setStatus] = useState<ApplicationStatus>(savedStatus ?? "saved");
  const [error, setError] = useState<string | null>(null);

  function update(next: ApplicationStatus) {
    setStatus(next);
    setSaved(true);
    setError(null);
    startTransition(async () => {
      const result = await saveOpportunityAction(opportunityId, next);
      if (!result.ok) setError(result.message);
    });
  }

  function remove() {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await unsaveOpportunityAction(opportunityId);
      if (!result.ok) {
        setSaved(true);
        setError(result.message);
      }
    });
  }

  return (
    <div className="rounded-card bg-mist p-4">
      <p className="section-label">Your tracker</p>
      {saved ? (
        <>
          <Select
            aria-label="Application status"
            value={status}
            disabled={pending}
            onChange={(event) => update(event.target.value as ApplicationStatus)}
          >
            {APPLICATION_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <GhostButton
            type="button"
            onClick={remove}
            disabled={pending}
            className="mt-3 text-smoke"
          >
            Remove from my list
          </GhostButton>
        </>
      ) : (
        <button
          type="button"
          onClick={() => update("saved")}
          disabled={pending}
          className="mt-2 w-full rounded-button bg-char px-4 py-[13px] text-[13px] font-medium text-paper transition-colors hover:bg-ink disabled:bg-smoke"
        >
          {pending ? "Saving…" : "Save to my list"}
        </button>
      )}
      {error ? <p className="mt-3 text-[12px] text-ember">{error}</p> : null}
    </div>
  );
}
