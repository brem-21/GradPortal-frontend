import { cx } from "./ui";

/**
 * Score bar. Neutral by default, Ember only where a score is genuinely poor —
 * the system allows one accent, and a weak score is where it earns its place.
 */
export function ScoreMeter({
  value,
  max = 100,
  label,
  size = "default",
}: {
  value: number;
  max?: number;
  label?: string;
  size?: "default" | "small";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const weak = pct < 50;

  return (
    <div className="w-full">
      {label ? (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <span className="text-[13px] text-ink">{label}</span>
          <span className={cx("text-[12px]", weak ? "text-ember" : "text-pewter")}>
            {value.toFixed(max === 5 ? 1 : 0)}
            <span className="text-smoke">/{max}</span>
          </span>
        </div>
      ) : null}
      <div
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? "Score"}
        className={cx("w-full overflow-hidden bg-mist", size === "small" ? "h-px" : "h-[3px]")}
      >
        <div
          className={cx("h-full transition-[width] duration-700", weak ? "bg-ember" : "bg-ink")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
