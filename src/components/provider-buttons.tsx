"use client";

import { useFormStatus } from "react-dom";
import { signInWithGoogle, signInWithLinkedIn } from "@/lib/auth-actions";
import { Arrow, cx } from "./ui";

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.85 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.67-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.67 2.84C6.71 7.29 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function LinkedInMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#0A66C2" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function ProviderButton({
  mark,
  label,
  note,
  tone,
}: {
  mark: React.ReactNode;
  label: string;
  note: string;
  tone: "light" | "dark";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cx(
        "group flex w-full items-center gap-4 rounded-card border px-5 py-5 text-left",
        "transition-all duration-300 disabled:cursor-wait disabled:opacity-60",
        tone === "dark"
          ? "border-paper/20 bg-paper/5 hover:border-paper/60 hover:bg-paper/10"
          : "border-mist bg-paper hover:border-ink",
      )}
    >
      <span className="shrink-0">{mark}</span>
      <span className="flex-1">
        <span
          className={cx(
            "block text-[15px] font-normal",
            tone === "dark" ? "text-paper" : "text-ink",
          )}
        >
          {pending ? "Redirecting…" : label}
        </span>
        <span
          className={cx(
            "mt-1 block text-[12px] leading-relaxed",
            tone === "dark" ? "text-mist/80" : "text-pewter",
          )}
        >
          {note}
        </span>
      </span>
      <Arrow
        className={cx(
          "group-hover:translate-x-1",
          tone === "dark" ? "text-paper" : "text-ink",
        )}
      />
    </button>
  );
}

export function ProviderButtons({
  callbackUrl = "/overview",
  tone = "light",
  google = true,
  linkedin = true,
}: {
  callbackUrl?: string;
  tone?: "light" | "dark";
  google?: boolean;
  linkedin?: boolean;
}) {
  if (!google && !linkedin) {
    return (
      <div
        className={cx(
          "rounded-card border px-4 py-4 text-[13px] leading-relaxed",
          tone === "dark" ? "border-paper/25 text-mist" : "border-mist text-pewter",
        )}
      >
        <strong className={tone === "dark" ? "text-paper" : "text-ink"}>
          No sign-in provider is configured.
        </strong>{" "}
        Add <code className="text-[11px]">AUTH_GOOGLE_ID</code> /{" "}
        <code className="text-[11px]">AUTH_GOOGLE_SECRET</code> or the LinkedIn pair to{" "}
        <code className="text-[11px]">frontend/.env.local</code> and restart.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {google ? (
      <form action={signInWithGoogle.bind(null, callbackUrl)}>
        <ProviderButton
          mark={<GoogleMark />}
          label="Continue with Google"
          note="Also grants permission to send enquiry emails from your own Gmail address, so replies reach your inbox."
          tone={tone}
        />
      </form>
      ) : null}
      {linkedin ? (
      <form action={signInWithLinkedIn.bind(null, callbackUrl)}>
        <ProviderButton
          mark={<LinkedInMark />}
          label="Continue with LinkedIn"
          note="Signs you in and pre-fills your profile. LinkedIn cannot send mail on your behalf."
          tone={tone}
        />
      </form>
      ) : null}
    </div>
  );
}
