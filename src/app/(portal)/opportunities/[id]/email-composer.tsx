"use client";

import { useActionState, useRef, useState } from "react";
import { refineEmailAction } from "@/lib/ai-actions";
import { useProgress } from "@/components/progress-rail";
import { NavIcon } from "@/components/nav-icon";
import { IDLE } from "@/lib/action-state";
import { sendOutreachAction } from "@/lib/actions";
import { Field, FormMessage, SubmitButton, TextArea, TextInput, Toggle } from "@/components/form";
import { useConfirm } from "@/components/confirm-dialog";
import { GhostButton, SectionLabel, cx } from "@/components/ui";
import type { Contact, OutreachDraft } from "@/types/api";

interface RefineState {
  changes: string[];
  warnings: string[];
  previousSubject: string;
  previousBody: string;
}

/**
 * Compose and send the enquiry. The draft arrives prefilled from the API but is
 * fully editable — nothing leaves the user's mailbox that they have not read.
 */
export function EmailComposer({
  opportunityId,
  contacts,
  draft,
  fromEmail,
  opportunity,
}: {
  opportunityId: string;
  contacts: Contact[];
  draft: OutreachDraft;
  fromEmail: string;
  opportunity?: Record<string, unknown>;
}) {
  const [state, action] = useActionState(sendOutreachAction, IDLE);
  const progress = useProgress();
  const confirm = useConfirm();
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [refining, setRefining] = useState(false);
  const [refined, setRefined] = useState<RefineState | null>(null);
  const [refineError, setRefineError] = useState<string | null>(null);
  const sendConfirmed = useRef(false);
  const emailContacts = contacts.filter((c) => c.email);
  const [selected, setSelected] = useState(
    emailContacts.find((c) => c.email === draft.to_email)?.id ?? emailContacts[0]?.id ?? "",
  );
  const active = emailContacts.find((c) => c.id === selected);

  async function refine() {
    setRefining(true);
    setRefineError(null);
    const task = progress.start("Refining your email");

    const result = await refineEmailAction({
      subject,
      body,
      contactName: active?.name ?? draft.to_name ?? null,
      opportunity: opportunity ?? null,
    });

    setRefining(false);
    if (!result.ok) {
      task.fail("Refine failed");
      setRefineError(result.message);
      return;
    }

    task.done();
    setRefined({
      changes: result.changes ?? [],
      warnings: result.warnings ?? [],
      previousSubject: subject,
      previousBody: body,
    });
    setSubject(result.subject ?? subject);
    setBody(result.body ?? body);
  }

  function undoRefine() {
    if (!refined) return;
    setSubject(refined.previousSubject);
    setBody(refined.previousBody);
    setRefined(null);
  }

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

  // The form still posts through the action; this only gates the submit.
  async function guardSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (sendConfirmed.current) {
      sendConfirmed.current = false;
      return;
    }
    event.preventDefault();
    const form = event.currentTarget;
    const confirmed = await confirm({
      title: "Send this email?",
      body: `It goes to ${active?.email ?? draft.to_email} from ${fromEmail} straight away. An email to an admissions contact cannot be recalled, so read it once more — especially for any bracketed placeholder.`,
      confirmLabel: "Send it",
    });
    if (confirmed) {
      sendConfirmed.current = true;
      form.requestSubmit();
    }
  }

  return (
    <form action={action} onSubmit={guardSubmit} className="rounded-card border border-mist p-6">
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
          <TextInput
            name="subject"
            required
            maxLength={500}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />
        </Field>

        <Field
          label="Message"
          hint="Edit freely. Replace any bracketed placeholder before sending."
        >
          <TextArea
            name="body"
            required
            rows={16}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </Field>

        {/* AI refinement sits next to the body, where the writing happens. */}
        <div className="rounded-card border border-mist p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-[14px] text-ink">
                <NavIcon name="sparkle" className="text-ember" />
                Refine with Counsel
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-pewter">
                Tightens the draft against what your own documents actually say. It
                will not invent a credential you have not claimed.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {refined ? (
                <GhostButton type="button" onClick={undoRefine} className="text-smoke">
                  Undo
                </GhostButton>
              ) : null}
              <button
                type="button"
                onClick={refine}
                disabled={refining || body.trim().length < 20}
                className={cx(
                  "rounded-button border border-ink/25 px-4 py-2.5 text-[12px] font-medium",
                  "transition-colors hover:border-ink hover:bg-ink hover:text-paper",
                  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink",
                )}
              >
                {refining ? "Refining…" : refined ? "Refine again" : "Refine"}
              </button>
            </div>
          </div>

          {refineError ? (
            <p className="mt-3 text-[12px] text-ember">{refineError}</p>
          ) : null}

          {refined ? (
            <div className="mt-4 border-t border-mist pt-3">
              {refined.changes.length > 0 ? (
                <>
                  <p className="section-label">What changed</p>
                  <ul className="mt-1.5 space-y-1">
                    {refined.changes.map((change) => (
                      <li key={change} className="text-[12px] leading-relaxed text-pewter">
                        · {change}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              {refined.warnings.length > 0 ? (
                <>
                  <p className="section-label mt-3 text-ember">Fix before sending</p>
                  <ul className="mt-1.5 space-y-1">
                    {refined.warnings.map((warning) => (
                      <li key={warning} className="text-[12px] leading-relaxed text-ink">
                        · {warning}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

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
