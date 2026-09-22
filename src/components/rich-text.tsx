"use client";

import { Fragment, type ReactNode, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cx } from "./ui";

/**
 * Markdown rendering for model output, styled to the Aker system.
 *
 * Models answer in markdown whether or not you ask them to, so rendering it as
 * plain text throws away the structure they already produced — the lists,
 * emphasis and tables that make a long answer scannable.
 *
 * Citation markers are the other half. `[1]` is turned into a chip that
 * highlights its source card, so a claim and its evidence are linked rather
 * than sitting in two lists the reader has to reconcile by eye.
 */

const CITATION = /\[(\d{1,2})\]/g;

function CitationChip({ index }: { index: number }) {
  return (
    <button
      type="button"
      onClick={() => {
        const target = document.getElementById(`source-${index}`);
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("source-flash");
        window.setTimeout(() => target.classList.remove("source-flash"), 1400);
      }}
      aria-label={`Jump to source ${index}`}
      className={cx(
        "mx-[1px] inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-pill",
        "bg-ember/12 px-1 align-[1px] text-[10px] font-medium text-ember",
        "transition-colors hover:bg-ember hover:text-paper",
      )}
    >
      {index}
    </button>
  );
}

/** Replace [n] markers inside a text node with interactive chips. */
function withCitations(children: ReactNode): ReactNode {
  return (Array.isArray(children) ? children : [children]).map((child, position) => {
    if (typeof child !== "string") return <Fragment key={position}>{child}</Fragment>;

    const parts: ReactNode[] = [];
    let cursor = 0;
    let match: RegExpExecArray | null;
    CITATION.lastIndex = 0;

    while ((match = CITATION.exec(child)) !== null) {
      if (match.index > cursor) parts.push(child.slice(cursor, match.index));
      parts.push(<CitationChip key={`${position}-${match.index}`} index={Number(match[1])} />);
      cursor = match.index + match[0].length;
    }
    if (cursor === 0) return <Fragment key={position}>{child}</Fragment>;
    if (cursor < child.length) parts.push(child.slice(cursor));
    return <Fragment key={position}>{parts}</Fragment>;
  });
}

export function RichText({
  children,
  className,
  compact = false,
}: {
  children: string;
  className?: string;
  compact?: boolean;
}) {
  const components = useMemo(
    () => ({
      p: ({ children }: { children?: ReactNode }) => (
        <p className={cx("leading-[1.65]", compact ? "mb-2.5" : "mb-3.5")}>
          {withCitations(children)}
        </p>
      ),
      strong: ({ children }: { children?: ReactNode }) => (
        <strong className="font-medium text-ink">{withCitations(children)}</strong>
      ),
      em: ({ children }: { children?: ReactNode }) => (
        <em className="italic">{withCitations(children)}</em>
      ),
      h1: ({ children }: { children?: ReactNode }) => (
        <h3 className="mb-2 mt-5 text-[18px] font-normal leading-snug text-ink first:mt-0">
          {children}
        </h3>
      ),
      h2: ({ children }: { children?: ReactNode }) => (
        <h4 className="mb-2 mt-5 text-[16px] font-normal leading-snug text-ink first:mt-0">
          {children}
        </h4>
      ),
      h3: ({ children }: { children?: ReactNode }) => (
        <h5 className="section-label mb-1.5 mt-4 first:mt-0">{children}</h5>
      ),
      h4: ({ children }: { children?: ReactNode }) => (
        <h5 className="section-label mb-1.5 mt-4 first:mt-0">{children}</h5>
      ),
      ul: ({ children }: { children?: ReactNode }) => (
        <ul className={cx("space-y-1.5", compact ? "mb-2.5" : "mb-3.5")}>{children}</ul>
      ),
      ol: ({ children }: { children?: ReactNode }) => (
        <ol className={cx("counter-reset-list space-y-1.5", compact ? "mb-2.5" : "mb-3.5")}>
          {children}
        </ol>
      ),
      li: ({ children }: { children?: ReactNode }) => (
        // A hairline dash rather than a bullet glyph: the system has no filled
        // dots anywhere else.
        <li className="relative pl-4 leading-[1.6] before:absolute before:left-0 before:top-[0.72em] before:h-px before:w-2 before:bg-smoke">
          {withCitations(children)}
        </li>
      ),
      blockquote: ({ children }: { children?: ReactNode }) => (
        <blockquote className="my-3 border-l border-mist pl-4 font-serif text-[15px] leading-[1.5] text-pewter">
          {children}
        </blockquote>
      ),
      code: ({ children, className: cls }: { children?: ReactNode; className?: string }) => {
        const isBlock = Boolean(cls);
        if (isBlock) {
          return (
            <code className="block overflow-x-auto rounded-small bg-mist p-3 font-mono text-[12px] leading-relaxed text-ink">
              {children}
            </code>
          );
        }
        return (
          <code className="rounded-small bg-mist px-1.5 py-0.5 font-mono text-[12px] text-ink">
            {children}
          </code>
        );
      },
      pre: ({ children }: { children?: ReactNode }) => <pre className="my-3">{children}</pre>,
      a: ({ href, children }: { href?: string; children?: ReactNode }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ember underline decoration-ember/30 underline-offset-2 transition-colors hover:decoration-ember"
        >
          {children}
        </a>
      ),
      hr: () => <hr className="my-5 border-0 border-t border-mist" />,
      table: ({ children }: { children?: ReactNode }) => (
        <div className="my-4 overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">{children}</table>
        </div>
      ),
      thead: ({ children }: { children?: ReactNode }) => (
        <thead className="border-b border-mist">{children}</thead>
      ),
      th: ({ children }: { children?: ReactNode }) => (
        <th className="section-label px-2 py-2 text-left">{children}</th>
      ),
      td: ({ children }: { children?: ReactNode }) => (
        <td className="border-b border-mist px-2 py-2 align-top leading-relaxed">
          {withCitations(children)}
        </td>
      ),
    }),
    [compact],
  );

  return (
    <div className={cx("text-[14px] text-ink [&>*:last-child]:mb-0", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
