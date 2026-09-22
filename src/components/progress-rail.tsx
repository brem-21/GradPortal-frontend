"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cx } from "./ui";

type Phase = "idle" | "working" | "failed" | "done";

interface RailValue {
  /** Begin a task. Returns handles to finish it either way. */
  start: (label?: string) => {
    set: (percent: number) => void;
    done: () => void;
    fail: (reason?: string) => void;
  };
}

const RailContext = createContext<RailValue | null>(null);

export function useProgress(): RailValue {
  const context = useContext(RailContext);
  // A component outside the provider should still work, just without a bar.
  return (
    context ?? {
      start: () => ({ set: () => {}, done: () => {}, fail: () => {} }),
    }
  );
}

/**
 * Vertical progress rail down the left edge.
 *
 * Ash while working, green on success, red on failure — so the outcome is
 * readable from the corner of the eye without reading any text. Progress
 * creeps toward 90% on a curve because most of what it tracks (an LLM call, a
 * crawl) has no real percentage to report; pretending otherwise with a
 * uniformly advancing bar is a worse lie than an obvious easing curve.
 */
export function ProgressRail({ children }: { children: React.ReactNode }) {
  const [percent, setPercent] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [label, setLabel] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const resetRef = useRef<number | null>(null);
  const activeRef = useRef(0);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const clearTimers = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (resetRef.current) window.clearTimeout(resetRef.current);
    timerRef.current = null;
    resetRef.current = null;
  }, []);

  const start = useCallback(
    (nextLabel?: string) => {
      activeRef.current += 1;
      clearTimers();
      setPhase("working");
      setLabel(nextLabel ?? null);
      setPercent((current) => (current > 0 && current < 90 ? current : 8));

      timerRef.current = window.setInterval(() => {
        setPercent((current) => {
          if (current >= 90) return current;
          // Decelerate as it climbs: fast to 50, slow past 80.
          const step = current < 50 ? 4 : current < 80 ? 1.5 : 0.4;
          return Math.min(90, current + step);
        });
      }, 180);

      const finish = (nextPhase: Phase, reason?: string) => {
        activeRef.current = Math.max(0, activeRef.current - 1);
        if (activeRef.current > 0) return; // another task is still running
        clearTimers();
        setPercent(100);
        setPhase(nextPhase);
        if (reason) setLabel(reason);
        resetRef.current = window.setTimeout(
          () => {
            setPercent(0);
            setPhase("idle");
            setLabel(null);
          },
          nextPhase === "failed" ? 4000 : 900,
        );
      };

      return {
        set: (value: number) => setPercent(Math.max(0, Math.min(99, value))),
        done: () => finish("done"),
        fail: (reason?: string) => finish("failed", reason),
      };
    },
    [clearTimers],
  );

  // A route change is a load too; flash the rail so navigation feels answered.
  useEffect(() => {
    const handle = start();
    const timer = window.setTimeout(() => handle.done(), 240);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => clearTimers, [clearTimers]);

  const visible = phase !== "idle";
  const colour =
    phase === "failed" ? "bg-ember" : phase === "done" ? "bg-pine" : "bg-smoke";

  return (
    <RailContext.Provider value={{ start }}>
      {/* The rail itself: fixed to the left edge, above everything. */}
      <div
        aria-hidden={!visible}
        className={cx(
          "pointer-events-none fixed inset-y-0 left-0 z-[300] w-[3px] transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="h-full w-full bg-mist/60">
          <div
            className={cx("w-full transition-[height,background-color] duration-200", colour)}
            style={{ height: `${percent}%` }}
          />
        </div>
      </div>

      {/* Accessible announcement and, when we have one, a readable label. */}
      <div
        role="status"
        aria-live="polite"
        className={cx(
          "pointer-events-none fixed bottom-6 left-5 z-[300] transition-all duration-300",
          visible && label ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        )}
      >
        {label ? (
          <span
            className={cx(
              "rounded-pill px-3 py-1.5 text-[11px] font-medium",
              phase === "failed"
                ? "bg-ember text-paper"
                : phase === "done"
                  ? "bg-pine text-paper"
                  : "bg-char text-paper",
            )}
          >
            {label}
            {phase === "working" ? ` · ${Math.round(percent)}%` : ""}
          </span>
        ) : null}
      </div>

      {children}
    </RailContext.Provider>
  );
}
