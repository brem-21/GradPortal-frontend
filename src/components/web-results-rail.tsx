"use client";

import { cx } from "./ui";
import type { StreamWebSource } from "@/lib/counsel-stream";

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 40);
  }
}

/**
 * Web sources shown in the blurred space beside the pane.
 *
 * The answer cites its sources, but a list of links under a paragraph gets
 * scrolled past. Surfacing them alongside — while the answer is still being
 * written — makes the sourcing visible at the moment it matters, in space the
 * pane is already occluding anyway.
 */
export function WebResultsRail({
  sources,
  searching,
}: {
  sources: StreamWebSource[];
  searching: boolean;
}) {
  if (!searching && sources.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-y-0 left-0 z-[115] hidden w-[calc(100vw-520px)] items-center justify-center px-10 lg:flex"
    >
      <div className="animate-fade-up w-full max-w-[520px]">
        <p className="section-label mb-3 text-paper/70">
          {searching && sources.length === 0
            ? "Searching the web"
            : `${sources.length} source${sources.length === 1 ? "" : "s"} consulted`}
        </p>

        {searching && sources.length === 0 ? (
          <ul className="space-y-2.5">
            {[0, 1, 2].map((index) => (
              <li
                key={index}
                className="h-[62px] animate-pulse rounded-card bg-paper/15"
                style={{ animationDelay: `${index * 140}ms` }}
              />
            ))}
          </ul>
        ) : (
          <ul className="max-h-[70vh] space-y-2.5 overflow-hidden">
            {sources.map((source, index) => (
              <li
                key={source.url}
                className={cx(
                  "animate-fade-up rounded-card border border-paper/20 bg-midnight/70 p-3.5 backdrop-blur-sm",
                )}
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <p className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-paper/55">
                  <span className="h-1 w-1 rounded-pill bg-ember" />
                  {hostOf(source.url)}
                </p>
                <p className="line-clamp-2 text-[13px] leading-snug text-paper">
                  {source.title}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
