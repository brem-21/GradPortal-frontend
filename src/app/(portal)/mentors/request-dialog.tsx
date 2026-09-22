"use client";

import { useActionState, useState } from "react";
import { IDLE } from "@/lib/action-state";
import { requestMentorshipAction } from "@/lib/actions";
import { Field, FormMessage, SubmitButton, TextArea, TextInput } from "@/components/form";
import { GhostButton, SectionLabel } from "@/components/ui";

export function RequestDialog({
  mentorId,
  mentorName,
}: {
  mentorId: string;
  mentorName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(requestMentorshipAction, IDLE);

  if (state.ok) {
    return <p className="text-[13px] text-pewter">{state.message}</p>;
  }

  if (!open) {
    return (
      <GhostButton type="button" onClick={() => setOpen(true)}>
        Request mentorship →
      </GhostButton>
    );
  }

  return (
    <form action={action} className="mt-4 rounded-card bg-mist p-4">
      <input type="hidden" name="mentor_id" value={mentorId} />
      <SectionLabel>Writing to {mentorName}</SectionLabel>

      <div className="space-y-4">
        <Field label="Topic">
          <TextInput
            name="topic"
            maxLength={255}
            placeholder="Choosing between a funded PhD and a taught master's"
          />
        </Field>
        <Field label="Message" hint="A sentence or two on where you are and what you need.">
          <TextArea
            name="message"
            rows={5}
            required
            minLength={10}
            maxLength={4000}
            placeholder="I'm finishing a CS degree in Ghana and targeting AI master's programmes in Europe for Fall 2027…"
          />
        </Field>

        <FormMessage state={state} />

        <div className="flex items-center gap-5">
          <SubmitButton pendingLabel="Sending…">Send request</SubmitButton>
          <GhostButton type="button" onClick={() => setOpen(false)} className="text-smoke">
            Cancel
          </GhostButton>
        </div>
      </div>
    </form>
  );
}
