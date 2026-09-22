"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { cx } from "./ui";

export interface ConfirmOptions {
  title: string;
  /** What will actually happen. Be concrete — this is the whole point. */
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive styling and a slower, deliberate confirm. */
  tone?: "default" | "danger";
  /** Require typing this word. Reserve for genuinely irreversible actions. */
  typeToConfirm?: string;
}

type Resolver = (confirmed: boolean) => void;

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(
  null,
);

/** `const confirm = useConfirm(); if (await confirm({...})) { ... }` */
export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return context;
}

/**
 * One dialog for every destructive or outward-facing action.
 *
 * Promise-based rather than callback-based so a caller reads top to bottom:
 * the action and the guard stay in the same function instead of being split
 * across a handler and a piece of state.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [typed, setTyped] = useState("");
  const resolverRef = useRef<Resolver | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    setOptions(next);
    setTyped("");
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = useCallback((confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setOptions(null);
    setTyped("");
  }, []);

  useEffect(() => {
    if (!options) return;
    // Focus the confirm button, but never make Enter the accidental path for a
    // destructive action.
    const timer = window.setTimeout(() => confirmRef.current?.focus(), 60);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") settle(false);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [options, settle]);

  const danger = options?.tone === "danger";
  const needsTyping = Boolean(options?.typeToConfirm);
  const canConfirm = !needsTyping || typed.trim() === options?.typeToConfirm;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {options ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-body"
          className="fixed inset-0 z-[200] flex items-center justify-center px-4"
        >
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => settle(false)}
            className="animate-scrim-in absolute inset-0 cursor-default bg-midnight/55 backdrop-blur-md"
          />

          <div className="animate-fade-up relative w-full max-w-[420px] rounded-card bg-paper p-7">
            <p
              className={cx(
                "section-label mb-2",
                danger ? "text-ember" : undefined,
              )}
            >
              {danger ? "This cannot be undone" : "Confirm"}
            </p>
            <h2 id="confirm-title" className="mb-3 text-[22px] font-light tracking-[-0.44px]">
              {options.title}
            </h2>
            <p id="confirm-body" className="text-[15px] leading-[1.5] text-pewter">
              {options.body}
            </p>

            {needsTyping ? (
              <label className="mt-5 block">
                <span className="section-label block">
                  Type <span className="text-ink">{options.typeToConfirm}</span> to confirm
                </span>
                <input
                  autoFocus
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  className="mt-2 w-full rounded-small border border-mist px-3 py-2 text-[15px] focus:border-ink focus:outline-none"
                />
              </label>
            ) : null}

            <div className="mt-7 flex items-center justify-end gap-5">
              <button
                type="button"
                onClick={() => settle(false)}
                className="text-[13px] text-pewter transition-colors hover:text-ink"
              >
                {options.cancelLabel ?? "Cancel"}
              </button>
              <button
                ref={confirmRef}
                type="button"
                disabled={!canConfirm}
                onClick={() => settle(true)}
                className={cx(
                  "rounded-button px-4 py-[13px] text-[13px] font-medium leading-none transition-colors",
                  danger
                    ? "bg-ember text-paper hover:bg-[#9c4a21]"
                    : "bg-char text-paper hover:bg-ink",
                  !canConfirm && "cursor-not-allowed opacity-40",
                )}
              >
                {options.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}
