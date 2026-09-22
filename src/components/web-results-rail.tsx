"use client";

import { useEffect, useState } from "react";
import { cx } from "./ui";
import { fetchImmigrationNewsAction } from "@/lib/actions";
import type { StreamWebSource } from "@/lib/counsel-stream";
import type { NewsItem } from "@/types/api";

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 40);
  }
}

/** "3d ago" reads faster than a date when the point is that the news is live. */
function agoOf(iso: string | null): string | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/**
 * One rail entry. Always a link — a headline you cannot open is a tease — and
 * the preview stays collapsed until hover so the rail reads as a list first.
 */
function RailCard({
  eyebrow,
  accent,
  title,
  preview,
  meta,
  url,
  index,
}: {
  eyebrow: string;
  accent: string;
  title: string;
  preview?: string | null;
  meta?: string | null;
  url: string;
  index: number;
}) {
  return (
    <li className="animate-fade-up" style={{ animationDelay: `${index * 90}ms` }}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cx(
          "group pointer-events-auto block rounded-card border border-paper/20 bg-midnight/70 p-3.5",
          "backdrop-blur-sm transition-colors hover:border-ember hover:bg-midnight/90",
          "focus-visible:border-ember focus-visible:outline-none",
        )}
      >
        <p className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-paper/55">
          <span className={cx("h-1 w-1 shrink-0 rounded-pill", accent)} />
          <span className="truncate">{eyebrow}</span>
          {meta ? <span className="shrink-0 text-paper/40">· {meta}</span> : null}
        </p>
        <p className="line-clamp-2 text-[13px] leading-snug text-paper">{title}</p>
        {preview ? (
          <p
            className={cx(
              "mt-0 max-h-0 overflow-hidden text-[12px] leading-snug text-paper/60",
              "transition-all duration-200 group-hover:mt-1.5 group-hover:max-h-16",
              "group-focus-visible:mt-1.5 group-focus-visible:max-h-16",
            )}
          >
            <span className="line-clamp-3">{preview}</span>
          </p>
        ) : null}
      </a>
    </li>
  );
}

function Skeletons() {
  return (
    <ul className="space-y-2.5">
      {[0, 1, 2].map((index) => (
        <li
          key={index}
          className="h-[62px] animate-pulse rounded-card bg-paper/15"
          style={{ animationDelay: `${index * 140}ms` }}
        />
      ))}
    </ul>
  );
}

/**
 * The blurred space beside the Counsel pane.
 *
 * Before a question it carries live student-immigration headlines, so the area
 * opens with something worth reading rather than empty blur. Once a question is
 * asked it switches to the sources that answer is drawing on — the answer cites
 * them, but a list of links under a paragraph gets scrolled past, and showing
 * them here while the answer is still being written makes the sourcing visible
 * at the moment it matters.
 */
export function WebResultsRail({
  sources,
  searching,
  active,
}: {
  sources: StreamWebSource[];
  searching: boolean;
  /** True once the thread has a question in it — headlines give way to sources. */
  active: boolean;
}) {
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const showNews = !active && !searching && sources.length === 0;

  useEffect(() => {
    if (!showNews || news !== null) return;
    let cancelled = false;
    fetchImmigrationNewsAction().then((items) => {
      if (!cancelled) setNews(items);
    });
    return () => {
      cancelled = true;
    };
  }, [showNews, news]);

  // Nothing to show: a started thread that never ran a web search.
  if (!showNews && !searching && sources.length === 0) return null;
  if (showNews && news?.length === 0) return null;

  const label = showNews
    ? "Student immigration newswire"
    : searching && sources.length === 0
      ? "Searching the web"
      : `${sources.length} source${sources.length === 1 ? "" : "s"} consulted`;

  return (
    // The rail itself ignores pointer events so the scrim behind it still
    // closes Counsel; only the cards take clicks.
    <aside
      aria-label={label}
      className="pointer-events-none fixed inset-y-0 left-0 z-[115] hidden w-[calc(100vw-520px)] items-center justify-center px-10 lg:flex"
    >
      <div className="animate-fade-up w-full max-w-[520px]">
        <p className="section-label mb-3 text-paper/70">{label}</p>

        {showNews ? (
          news === null ? (
            <Skeletons />
          ) : (
            <ul className="max-h-[70vh] space-y-2.5 overflow-hidden">
              {news.map((item, index) => (
                <RailCard
                  key={item.url}
                  eyebrow={`${item.region} · ${item.source}`}
                  accent="bg-paper/50"
                  title={item.title}
                  preview={item.summary}
                  meta={agoOf(item.published_at)}
                  url={item.url}
                  index={index}
                />
              ))}
            </ul>
          )
        ) : searching && sources.length === 0 ? (
          <Skeletons />
        ) : (
          <ul className="max-h-[70vh] space-y-2.5 overflow-hidden">
            {sources.map((source, index) => (
              <RailCard
                key={source.url}
                eyebrow={hostOf(source.url)}
                accent="bg-ember"
                title={source.title}
                url={source.url}
                index={index}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
