import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* ============================================================
   Aker primitives.
   Ghost text-arrow is the default action; filled dark is rare.
   Buttons carry the 80px radius, cards the 8px, tags the pill.
   ============================================================ */

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cx("shrink-0 transition-transform duration-200", className)}
    >
      <path
        d="M2.5 8h11m0 0L9 3.5M13.5 8 9 12.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Tone = "ink" | "paper";

/** Ghost text + trailing arrow. The system's default affordance. */
export function TextArrowLink({
  href,
  children,
  tone = "ink",
  external = false,
  className,
}: {
  href: string;
  children: ReactNode;
  tone?: Tone;
  external?: boolean;
  className?: string;
}) {
  const classes = cx(
    "group inline-flex items-center gap-2 text-[15px] font-normal",
    tone === "paper" ? "text-paper" : "text-ink",
    "hover:text-ember transition-colors duration-200",
    className,
  );
  const inner = (
    <>
      <span className="border-b border-transparent group-hover:border-current pb-px">
        {children}
      </span>
      <Arrow className="group-hover:translate-x-1" />
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {inner}
    </Link>
  );
}

/** Outlined pill variant of the text-arrow action. */
export function PillLink({
  href,
  children,
  tone = "ink",
  external = false,
  className,
}: {
  href: string;
  children: ReactNode;
  tone?: Tone;
  external?: boolean;
  className?: string;
}) {
  const classes = cx(
    "group inline-flex items-center gap-2 rounded-button border px-4 py-[19px] text-[13px] font-normal leading-none transition-colors duration-200",
    tone === "paper"
      ? "border-paper/40 text-paper hover:border-paper hover:bg-paper hover:text-ink"
      : "border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-paper",
    className,
  );
  const inner = (
    <>
      {children}
      <Arrow className="group-hover:translate-x-1" />
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {inner}
    </Link>
  );
}

/** Filled dark button. Used sparingly, for the one action that matters most. */
export function FilledButton({
  children,
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-button bg-char px-4 py-[19px] text-[13px] font-medium leading-none text-paper",
        "transition-colors duration-200 hover:bg-ink disabled:cursor-not-allowed disabled:bg-smoke",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className, ...props }: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={cx(
        "group inline-flex items-center gap-2 text-[13px] font-normal text-ink transition-colors duration-200",
        "hover:text-ember disabled:cursor-not-allowed disabled:text-smoke",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function FilledLink({
  href,
  children,
  external = false,
  className,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
}) {
  const classes = cx(
    "inline-flex items-center justify-center gap-2 rounded-button bg-char px-4 py-[19px] text-[13px] font-medium leading-none text-paper transition-colors duration-200 hover:bg-ink",
    className,
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

/** Pill tag. 1584px radius is reserved for these and the nav pill. */
export function Tag({
  children,
  tone = "mist",
  className,
}: {
  children: ReactNode;
  tone?: "mist" | "paper" | "ember" | "outline";
  className?: string;
}) {
  const tones = {
    mist: "bg-mist text-ink",
    paper: "bg-transparent text-paper ring-1 ring-inset ring-paper/35",
    ember: "bg-transparent text-ember ring-1 ring-inset ring-ember/40",
    outline: "bg-transparent text-pewter ring-1 ring-inset ring-mist",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-pill px-[14px] py-[6px] text-[12px] font-medium leading-none",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cx("section-label mb-[6px]", className)}>{children}</p>
  );
}

export function Hairline({ className }: { className?: string }) {
  return <hr className={cx("hairline border-0", className)} />;
}

/** Numbered list row — "01 Invest" pattern from the source system. */
export function NumberedRow({
  index,
  label,
  detail,
  href,
}: {
  index: number;
  label: string;
  detail?: string;
  href?: string;
}) {
  const content = (
    <div className="hairline grid grid-cols-[42px_1fr_auto] items-baseline gap-4 py-6">
      <span className="text-[12px] font-normal text-smoke">
        {String(index).padStart(2, "0")}
      </span>
      <span className="text-[18px] font-normal text-ink">{label}</span>
      {detail ? <span className="text-[13px] text-pewter">{detail}</span> : <span />}
    </div>
  );
  return href ? (
    <Link href={href} className="block transition-opacity hover:opacity-60">
      {content}
    </Link>
  ) : (
    content
  );
}

/** Mist card — the light surface that floats on Paper. */
export function Card({
  children,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section" | "li";
}) {
  return (
    <As className={cx("rounded-card border border-mist bg-paper p-4", className)}>
      {children}
    </As>
  );
}

export function StatTile({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: number | string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-card bg-mist p-4">
      <p className="section-label">{label}</p>
      <p
        className={cx(
          "mt-2 text-[36px] font-light leading-none tracking-[-0.72px]",
          accent ? "text-ember" : "text-ink",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 text-[12px] text-pewter">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-mist px-6 py-16 text-center">
      <p className="heading text-ink">{title}</p>
      <p className="mx-auto mt-3 max-w-[440px] text-[15px] text-pewter">{body}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Banner({
  tone = "info",
  children,
}: {
  tone?: "info" | "warning" | "error";
  children: ReactNode;
}) {
  const tones = {
    info: "border-mist bg-mist text-ink",
    warning: "border-ember/30 bg-transparent text-ink",
    error: "border-coral/50 bg-transparent text-ink",
  } as const;
  return (
    <div className={cx("rounded-card border px-4 py-[14px] text-[13px]", tones[tone])}>
      {children}
    </div>
  );
}
