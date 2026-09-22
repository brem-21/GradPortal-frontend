"use client";

import { useActionState } from "react";
import { IDLE } from "@/lib/action-state";
import { createOpportunityAction } from "@/lib/actions";
import {
  CheckboxPills,
  Field,
  FormMessage,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
  Toggle,
} from "@/components/form";
import { Hairline, SectionLabel } from "@/components/ui";
import {
  DEGREE_OPTIONS,
  FIELD_OPTIONS,
  FUNDING_OPTIONS,
  TYPE_OPTIONS,
} from "@/lib/options";

export function SubmitForm() {
  const [state, action] = useActionState(createOpportunityAction, IDLE);

  return (
    <form action={action} className="space-y-10">
      <section className="space-y-6">
        <Field label="Title">
          <TextInput
            name="title"
            required
            maxLength={500}
            placeholder="Fully funded PhD in Machine Learning"
          />
        </Field>

        <Field label="Link to the original listing" hint="Where you found it.">
          <TextInput
            name="url"
            type="url"
            required
            placeholder="https://university.edu/phd/machine-learning"
          />
        </Field>

        <Field label="Direct application link" hint="Optional, if different.">
          <TextInput name="apply_url" type="url" />
        </Field>

        <Field
          label="Description"
          hint="Paste the relevant part of the listing. Eligibility and funding detail matter most."
        >
          <TextArea name="description" rows={8} />
        </Field>

        <Field label="One-line summary" hint="Shown in the feed.">
          <TextInput name="summary" maxLength={280} />
        </Field>
      </section>

      <Hairline />

      <section className="space-y-6">
        <div>
          <p className="section-label">Type</p>
          <Select name="opportunity_type" required defaultValue="">
            <option value="" disabled>
              Choose one
            </option>
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <p className="section-label">Fields — at least one</p>
          <CheckboxPills name="fields_of_study" options={FIELD_OPTIONS} />
        </div>

        <div>
          <p className="section-label">Degree level</p>
          <CheckboxPills name="degree_levels" options={DEGREE_OPTIONS} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Organisation">
            <TextInput name="organization" maxLength={255} />
          </Field>
          <Field label="Department">
            <TextInput name="department" maxLength={255} />
          </Field>
          <Field label="Location">
            <TextInput name="location" maxLength={255} placeholder="Edinburgh, Scotland" />
          </Field>
          <Field label="Country">
            <TextInput name="country" maxLength={100} placeholder="United Kingdom" />
          </Field>
          <Field label="Funding">
            <Select name="funding_type" defaultValue="unknown">
              <option value="unknown">Not specified</option>
              {FUNDING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount" hint="Free text, e.g. full tuition + £19,237/yr.">
            <TextInput name="funding_amount" maxLength={255} />
          </Field>
          <Field label="Application deadline">
            <TextInput name="application_deadline" type="date" />
          </Field>
          <Field label="Deadline note" hint="Use for rolling or varying deadlines.">
            <TextInput name="deadline_text" maxLength={255} placeholder="Rolling" />
          </Field>
        </div>

        <div className="space-y-4">
          <Toggle name="is_remote" label="Remote or online" />
          <Toggle
            name="open_to_international"
            label="Explicitly open to international students"
            hint="Only tick when the listing actually says so."
          />
        </div>
      </section>

      <Hairline />

      <section className="rounded-card bg-mist p-6">
        <SectionLabel>Contact</SectionLabel>
        <p className="mb-5 text-[13px] text-pewter">
          The single most useful thing you can add. A named admissions officer or PI
          beats a generic inbox, and lets applicants email from their own address.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          <Field label="Name">
            <TextInput name="contact_name" maxLength={255} placeholder="Dr. Aoife Brennan" />
          </Field>
          <Field label="Role">
            <TextInput
              name="contact_role"
              maxLength={255}
              placeholder="Principal Investigator"
            />
          </Field>
          <Field label="Email">
            <TextInput name="contact_email" type="email" placeholder="name@university.edu" />
          </Field>
        </div>
      </section>

      <FormMessage state={state} />
      <SubmitButton pendingLabel="Submitting…">Submit opportunity</SubmitButton>
    </form>
  );
}
