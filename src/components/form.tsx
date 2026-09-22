"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cx } from "./ui";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="section-label block">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[12px] text-smoke">{hint}</span> : null}
    </label>
  );
}

const CONTROL =
  "mt-2 w-full rounded-small border border-mist bg-paper px-3 py-[10px] text-[15px] text-ink " +
  "transition-colors duration-200 placeholder:text-smoke focus:border-ink focus:outline-none";

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(CONTROL, className)} />;
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(CONTROL, "resize-y", className)} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cx(CONTROL, className)}>
      {children}
    </select>
  );
}

/**
 * Multi-select rendered as pill tags. Checkboxes are visually hidden but remain
 * the accessible control, so the group works with a keyboard and a screen reader.
 */
export function CheckboxPills({
  name,
  options,
  defaultValues = [],
}: {
  name: string;
  options: { value: string; label: string; count?: number | null }[];
  defaultValues?: string[];
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map((option) => (
        <label
          key={option.value}
          className="group cursor-pointer select-none"
        >
          <input
            type="checkbox"
            name={name}
            value={option.value}
            defaultChecked={defaultValues.includes(option.value)}
            className="peer sr-only"
          />
          <span
            className={cx(
              "inline-flex items-center gap-1.5 rounded-pill px-[14px] py-[8px] text-[12px] font-medium leading-none",
              "ring-1 ring-inset ring-mist text-pewter transition-colors duration-200",
              "hover:ring-smoke",
              "peer-checked:bg-char peer-checked:text-paper peer-checked:ring-char",
              "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ember",
            )}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span className="opacity-55">{option.count}</span>
            ) : null}
          </span>
        </label>
      ))}
    </div>
  );
}

export function Toggle({
  name,
  label,
  hint,
  defaultChecked = false,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span
        className={cx(
          "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-small",
          "ring-1 ring-inset ring-smoke transition-colors duration-200",
          "peer-checked:bg-char peer-checked:ring-char",
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ember",
        )}
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.8"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-0 peer-checked:opacity-100"
          />
        </svg>
      </span>
      <span>
        <span className="block text-[15px] text-ink">{label}</span>
        {hint ? <span className="mt-0.5 block text-[12px] text-pewter">{hint}</span> : null}
      </span>
    </label>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  className,
  variant = "filled",
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "filled" | "ghost";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cx(
        variant === "filled"
          ? "inline-flex items-center justify-center rounded-button bg-char px-4 py-[19px] text-[13px] font-medium leading-none text-paper transition-colors duration-200 hover:bg-ink disabled:bg-smoke"
          : "inline-flex items-center gap-2 text-[13px] text-ink transition-colors duration-200 hover:text-ember disabled:text-smoke",
        "disabled:cursor-not-allowed",
        className,
      )}
    >
      {pending ? (pendingLabel ?? "Working…") : children}
    </button>
  );
}

export function FormMessage({ state }: { state: { ok: boolean; message: string | null } }) {
  if (!state.message) return null;
  return (
    <p
      role="status"
      className={cx(
        "rounded-card border px-4 py-[14px] text-[13px]",
        state.ok ? "border-mist bg-mist text-ink" : "border-coral/50 text-ink",
      )}
    >
      {state.message}
    </p>
  );
}
