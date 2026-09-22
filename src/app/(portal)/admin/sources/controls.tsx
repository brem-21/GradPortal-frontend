"use client";

import { useState, useTransition } from "react";
import {
  runAllSourcesAction,
  runSourceAction,
  seedSourcesAction,
  toggleSourceAction,
} from "@/lib/actions";
import { GhostButton, cx } from "@/components/ui";

export function SourcesToolbar({
  enabledCount,
  totalCount,
}: {
  enabledCount: number;
  totalCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(true);

  function run(fn: () => Promise<{ ok: boolean; message: string | null }>) {
    startTransition(async () => {
      const result = await fn();
      setOk(result.ok);
      setMessage(result.message);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-5">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(runAllSourcesAction)}
          className="rounded-button bg-char px-4 py-[13px] text-[13px] font-medium text-paper transition-colors hover:bg-ink disabled:bg-smoke"
        >
          {pending ? "Working…" : `Crawl all ${enabledCount} enabled`}
        </button>
        <GhostButton type="button" disabled={pending} onClick={() => run(seedSourcesAction)}>
          Seed starter catalogue →
        </GhostButton>
        <p className="text-[12px] text-smoke">
          {enabledCount} of {totalCount} enabled
        </p>
      </div>
      {message ? (
        <p className={cx("mt-4 text-[13px]", ok ? "text-pewter" : "text-ember")}>
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function SourceControls({ id, enabled }: { id: string; enabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(true);

  function run(fn: () => Promise<{ ok: boolean; message: string | null }>) {
    startTransition(async () => {
      const result = await fn();
      setOk(result.ok);
      setMessage(result.message);
    });
  }

  return (
    <div className="w-full shrink-0 sm:w-[240px]">
      <div className="flex items-center gap-4 sm:justify-end">
        <GhostButton
          type="button"
          disabled={pending}
          onClick={() => run(() => runSourceAction(id))}
        >
          Run now →
        </GhostButton>
        <GhostButton
          type="button"
          disabled={pending}
          onClick={() => run(() => toggleSourceAction(id, !enabled))}
          className="text-smoke"
        >
          {enabled ? "Disable" : "Enable"}
        </GhostButton>
      </div>
      {message ? (
        <p
          className={cx(
            "mt-3 text-[12px] leading-relaxed sm:text-right",
            ok ? "text-pewter" : "text-ember",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
