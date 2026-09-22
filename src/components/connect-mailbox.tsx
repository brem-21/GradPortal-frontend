"use client";

import { signInWithGoogle } from "@/lib/auth-actions";
import { useConfirm } from "./confirm-dialog";
import { NavIcon } from "./nav-icon";
import { cx } from "./ui";

/**
 * Attach a Gmail grant to an account that cannot currently send.
 *
 * LinkedIn has no API for sending mail on a member's behalf — it is an
 * identity provider and nothing more — so a LinkedIn user who wants outreach
 * to leave their own address has to authorise Google separately. This is that
 * second authorisation.
 *
 * It is guarded because sessions are keyed by email: authorising a *different*
 * Google account does not link a mailbox, it switches you to that account.
 */
export function ConnectMailbox({
  email,
  currentProvider,
}: {
  email: string;
  currentProvider: string | null;
}) {
  const confirm = useConfirm();

  async function connect() {
    const confirmed = await confirm({
      title: "Connect a Google mailbox?",
      body:
        `You will be sent to Google to authorise sending email. Use ${email} — ` +
        "the same address you signed in with. Authorising a different Google " +
        "account signs you in as that account instead of linking a mailbox to " +
        "this one.",
      confirmLabel: "Continue to Google",
    });
    if (confirmed) await signInWithGoogle("/settings");
  }

  return (
    <div className="rounded-card border border-ember/30 p-5">
      <p className="section-label text-ember">Outreach is disabled</p>
      <h3 className="mb-2 text-[18px] text-ink">Connect a mailbox</h3>
      <p className="prose-column mb-4 text-[13px] leading-relaxed text-pewter">
        {currentProvider === "linkedin"
          ? "LinkedIn signs you in but cannot send mail on your behalf — it has no API for it. Authorise Google separately and enquiries will leave from your own address, with replies coming back to your inbox."
          : "Enquiries to admissions contacts go out from your own mailbox, so replies reach you directly. That needs Google's permission to send on your behalf."}
      </p>
      <button
        type="button"
        onClick={connect}
        className={cx(
          "inline-flex items-center gap-2.5 rounded-button bg-char px-4 py-[13px]",
          "text-[13px] font-medium text-paper transition-colors hover:bg-ink",
        )}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.85 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.67-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.67 2.84C6.71 7.29 9.14 5.38 12 5.38z" />
        </svg>
        Authorise Gmail sending
      </button>
      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-smoke">
        <NavIcon name="user" className="mt-px h-3 w-3 shrink-0" />
        We request only <code className="text-[10px]">gmail.send</code>. That permits
        sending and nothing else — it cannot read your mail.
      </p>
    </div>
  );
}
