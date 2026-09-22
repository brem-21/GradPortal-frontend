"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deactivateAccountAction } from "@/lib/actions";
import { useConfirm } from "@/components/confirm-dialog";
import { cx } from "@/components/ui";

/** Irreversible actions, behind a type-to-confirm dialog. */
export function DangerZone({ email }: { email: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function deactivate() {
    const confirmed = await confirm({
      title: "Deactivate your account?",
      body:
        "You will be signed out and will not be able to sign back in. Your documents, shortlist, conversations and sent emails are retained but become inaccessible to you. This cannot be undone from the app.",
      confirmLabel: "Deactivate",
      tone: "danger",
      typeToConfirm: "DEACTIVATE",
    });
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await deactivateAccountAction();
      if (!result.ok) setError(result.message);
      else router.push("/");
    });
  }

  return (
    <div className="rounded-card border border-ember/30 p-5">
      <p className="section-label text-ember">Irreversible</p>
      <p className="mb-4 text-[15px] text-ink">Deactivate this account</p>
      <p className="prose-column mb-5 text-[13px] leading-relaxed text-pewter">
        Closes access for <span className="text-ink">{email}</span>. You will be signed
        out immediately and will not be able to sign back in.
      </p>
      <button
        type="button"
        onClick={deactivate}
        disabled={pending}
        className={cx(
          "rounded-button border border-ember px-4 py-[13px] text-[13px] font-medium text-ember",
          "transition-colors hover:bg-ember hover:text-paper disabled:opacity-50",
        )}
      >
        {pending ? "Deactivating…" : "Deactivate account"}
      </button>
      {error ? <p className="mt-3 text-[12px] text-ember">{error}</p> : null}
    </div>
  );
}
