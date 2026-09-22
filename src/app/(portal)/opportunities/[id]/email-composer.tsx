"use client";

import { useActionState, useState } from "react";
import { IDLE } from "@/lib/action-state";
import { sendOutreachAction } from "@/lib/actions";
import { Field, FormMessage, SubmitButton, TextArea, TextInput, Toggle } from "@/components/form";
import { SectionLabel } from "@/components/ui";
import type { Contact, OutreachDraft } from "@/types/api";

/**
 * Compose and send the enquiry. The draft arrives prefilled from the API but is
 * fully editable — nothing leaves the user's mailbox that they have not read.
 */
export function EmailComposer({
  opportunityId,
  contacts,
  draft,
  fromEmail,
}: {
  opportunityId: string;
  contacts: Contact[];
  draft: OutreachDraft;
  fromEmail: string;
}) {
  const [state, action] = useActionState(sendOutreachAction, IDLE);
  const emailContacts = contacts.filter((c) => c.email);
  const [selected, setSelected] = useState(
    emailContacts.find((c) => c.email === draft.to_email)?.id ?? emailContacts[0]?.id ?? "",
  );
  const active = emailContacts.find((c) => c.id === selected);

  if (emailContacts.length === 0) {
    return (
      <div className="rounded-card border border-mist p-6">
        <SectionLabel>Contact</SectionLabel>
        <h2 className="text-[22px] font-light tracking-[-0.44px]">
          No contact address on this listing
        </h2>
        <p className="prose-column mt-3 text-[13px] leading-relaxed text-pewter">
          The crawler did not find a published email on the source page. Open the
          original listing and look for a departmental contact — if you find one, a
          mentor or admin can add it so the next applicant does not have to.
        </p>
      </div>
    );
  }

  if (state.ok) {
    return (
      <div className="rounded-card bg-mist p-6">
        <SectionLabel>Sent</SectionLabel>
        <h2 className="text-[22px] font-light tracking-[-0.44px]">{state.message}</h2>
        <p className="mt-3 text-[13px] text-pewter">
          It is in your Sent folder, and any reply comes straight back to you.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-card border border-mist p-6">
      <input type="hidden" name="opportunity_id" value={opportunityId} />
      <input type="hidden" name="contact_id" value={selected} />

      <SectionLabel>Reach out</SectionLabel>
      <h2 className="mb-1 text-[22px] font-light tracking-[-0.44px]">
        Email the contact
      </h2>
      <p className="mb-6 text-[13px] text-pewter">
        Sent from <span className="text-ink">{fromEmail}</span> — your own mailbox, so
        the reply comes back to you.
      </p>

      {!draft.can_send ? (
        <div className="mb-6 rounded-card border border-ember/30 px-4 py-[14px] text-[13px]">
          {draft.send_blocked_reason}
        </div>
      ) : null}

      {emailContacts.length > 1 ? (
        <div className="mb-6">
          <p className="section-label">Who to write to</p>
          <div className="mt-3 space-y-2">
            {emailContacts.map((contact) => (
              <label
                key={contact.id}
                className="flex cursor-pointer items-start gap-3 rounded-card border border-mist p-3 transition-colors hover:border-smoke has-[:checked]:border-ink"
              >
                <input
                  type="radio"
                  name="_contact_pick"
                  value={contact.id}
                  checked={selected === contact.id}
                  onChange={() => setSelected(contact.id)}
                  className="mt-1"
                />
                <span className="min-w-0">
                  <span className="block text-[15px] text-ink">
                    {contact.name ?? contact.email}
                  </span>
                  <span className="block text-[12px] text-pewter">
                    {contact.role ? `${contact.role} · ` : ""}
                    {contact.email}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-5">
        <Field label="To">
          <TextInput
            name="to_email"
            type="email"
            required
            defaultValue={active?.email ?? draft.to_email ?? ""}
            key={selected}
          />
        </Field>

        <Field label="Subject">
          <TextInput name="subject" required maxLength={500} defaultValue={draft.subject} />
        </Field>

        <Field
          label="Message"
          hint="Edit freely. Replace the bracketed placeholder before sending."
        >
          <TextArea name="body" required rows={16} defaultValue={draft.body} />
        </Field>

        <Toggle
          name="cc_self"
          label="Copy myself"
          hint="Keeps a copy in your inbox as well as your Sent folder."
          defaultChecked
        />

        <FormMessage state={state} />

        <div className="flex items-center gap-6">
          <SubmitButton pendingLabel="Sending…">Send from my mailbox</SubmitButton>
          <p className="text-[12px] text-smoke">
            Limit of 25 a day, and the same contact once per 24 hours.
          </p>
        </div>
      </div>
    </form>
  );
}
