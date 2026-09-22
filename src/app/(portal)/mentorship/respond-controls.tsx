"use client";

import { useState, useTransition } from "react";
import { respondToMentorshipAction } from "@/lib/actions";
import { TextArea } from "@/components/form";
import { GhostButton } from "@/components/ui";

export function RespondControls({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  function respond(status: "accepted" | "declined") {
    setError(null);
    startTransition(async () => {
      const result = await respondToMentorshipAction(requestId, status, message || null);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <div className="mt-4 rounded-card bg-mist p-4">
      <label className="block">
        <span className="section-label block">Reply (optional)</span>
        <TextArea
          rows={3}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Happy to help — email me and we can set up a call."
          maxLength={2000}
        />
      </label>
      <div className="mt-4 flex items-center gap-5">
        <button
          type="button"
          disabled={pending}
          onClick={() => respond("accepted")}
          className="rounded-button bg-char px-4 py-[13px] text-[13px] font-medium text-paper transition-colors hover:bg-ink disabled:bg-smoke"
        >
          {pending ? "Working…" : "Accept"}
        </button>
        <GhostButton
          type="button"
          disabled={pending}
          onClick={() => respond("declined")}
          className="text-smoke"
        >
          Decline
        </GhostButton>
      </div>
      {error ? <p className="mt-3 text-[12px] text-ember">{error}</p> : null}
    </div>
  );
}
