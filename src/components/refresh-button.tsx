"use client";

import { useState, useTransition } from "react";
import { refreshOpportunitiesAction } from "@/lib/actions";
import { GhostButton, cx } from "./ui";

function relative(iso: string | null): string {
  if (!iso) return "never";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/**
 * Manual catalogue refresh.
 *
 * The scheduled crawl runs every four hours, which is right for deadlines that
 * move in days — but someone checking the morning a deadline closes should not
 * have to trust that. The button is throttled server-side, globally, so it
 * cannot be used to hammer the sites being crawled.
 */
export function RefreshButton({
  lastRefreshedAt,
  canRefresh,
  retryAfterSeconds,
  everyHours,
}: {
  lastRefreshedAt: string | null;
  canRefresh: boolean;
  retryAfterSeconds: number;
  everyHours: number;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(true);

  const cooling = !canRefresh && retryAfterSeconds > 0;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <p className="text-[12px] text-smoke">
        Updated {relative(lastRefreshedAt)} · refreshes every {everyHours}h
      </p>
      <GhostButton
        type="button"
        disabled={pending || cooling}
        onClick={() =>
          startTransition(async () => {
            const result = await refreshOpportunitiesAction();
            setOk(result.ok);
            setMessage(result.message);
          })
        }
      >
        {pending
          ? "Refreshing…"
          : cooling
            ? `Refresh in ${Math.ceil(retryAfterSeconds / 60)}m`
            : "Refresh now →"}
      </GhostButton>
      {message ? (
        <span className={cx("text-[12px]", ok ? "text-pewter" : "text-ember")}>
          {message}
        </span>
      ) : null}
    </div>
  );
}
