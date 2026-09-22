"use client";

import { useActionState } from "react";
import { IDLE } from "@/lib/action-state";
import { updatePreferencesAction, updateProfileAction } from "@/lib/actions";
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
import { AvatarField } from "@/components/avatar-field";
import { Hairline, SectionLabel } from "@/components/ui";
import {
  COUNTRY_SUGGESTIONS,
  DEGREE_OPTIONS,
  DIGEST_OPTIONS,
  FIELD_OPTIONS,
  FUNDING_OPTIONS,
  REGION_OPTIONS,
  TYPE_OPTIONS,
} from "@/lib/options";
import type { Preference, Profile } from "@/types/api";

const REMINDER_OPTIONS = [
  { value: "30", label: "30 days before" },
  { value: "14", label: "14 days" },
  { value: "7", label: "7 days" },
  { value: "3", label: "3 days" },
  { value: "1", label: "1 day" },
];

export function PreferencesForm({ preference }: { preference: Preference | null }) {
  const [state, action] = useActionState(updatePreferencesAction, IDLE);

  return (
    <form action={action} className="space-y-8">
      <div>
        <p className="section-label">Opportunity types</p>
        <CheckboxPills
          name="opportunity_types"
          options={TYPE_OPTIONS}
          defaultValues={preference?.opportunity_types ?? []}
        />
      </div>
      <div>
        <p className="section-label">Fields</p>
        <CheckboxPills
          name="fields_of_study"
          options={FIELD_OPTIONS}
          defaultValues={preference?.fields_of_study ?? []}
        />
      </div>
      <div>
        <p className="section-label">Degree level</p>
        <CheckboxPills
          name="degree_levels"
          options={DEGREE_OPTIONS}
          defaultValues={preference?.degree_levels ?? []}
        />
      </div>
      <div>
        <p className="section-label">Funding</p>
        <CheckboxPills
          name="funding_types"
          options={FUNDING_OPTIONS}
          defaultValues={preference?.funding_types ?? []}
        />
      </div>
      <div>
        <p className="section-label">Regions — the coarse cut</p>
        <CheckboxPills
          name="regions"
          options={REGION_OPTIONS}
          defaultValues={preference?.regions ?? []}
        />
      </div>
      <div>
        <p className="section-label">Specific countries — leave empty for anywhere in the regions above</p>
        <CheckboxPills
          name="countries"
          options={COUNTRY_SUGGESTIONS.map((c) => ({ value: c, label: c }))}
          defaultValues={preference?.countries ?? []}
        />
      </div>

      <Hairline />

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Email frequency">
          <Select name="email_digest" defaultValue={preference?.email_digest ?? "daily"}>
            {DIGEST_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end">
          <Toggle
            name="email_notifications_enabled"
            label="Send me emails at all"
            hint="In-app notifications keep working either way."
            defaultChecked={preference?.email_notifications_enabled ?? true}
          />
        </div>
      </div>

      <div>
        <p className="section-label">Deadline reminders for saved opportunities</p>
        <CheckboxPills
          name="deadline_reminder_days"
          options={REMINDER_OPTIONS}
          defaultValues={(preference?.deadline_reminder_days ?? [14, 7, 1]).map(String)}
        />
        <p className="mt-2 text-[12px] text-smoke">
          Deadline reminders always email, even on a digest setting — they are
          time-critical.
        </p>
      </div>

      <FormMessage state={state} />
      <SubmitButton pendingLabel="Saving…">Save preferences</SubmitButton>
    </form>
  );
}

export function ProfileForm({
  profile,
  avatarUrl,
}: {
  profile: Profile | null;
  avatarUrl: string | null;
}) {
  const [state, action] = useActionState(updateProfileAction, IDLE);

  return (
    <form action={action} className="space-y-8">
      <div className="rounded-card border border-mist p-6">
        <SectionLabel>Required</SectionLabel>
        <p className="mb-5 text-[13px] text-pewter">
          Contacts and mentors reply far more often to a profile with a face on it.
        </p>
        <AvatarField initial={avatarUrl} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Headline" className="md:col-span-2">
          <TextInput
            name="headline"
            maxLength={255}
            defaultValue={profile?.headline ?? ""}
            placeholder="Final-year CS student aiming for a funded AI master's"
          />
        </Field>
        <Field label="About you" className="md:col-span-2">
          <TextArea name="bio" rows={4} defaultValue={profile?.bio ?? ""} />
        </Field>
        <Field label="Country">
          <TextInput name="country" maxLength={100} defaultValue={profile?.country ?? ""} />
        </Field>
        <Field label="City">
          <TextInput name="city" maxLength={100} defaultValue={profile?.city ?? ""} />
        </Field>
        <Field label="Current institution or employer">
          <TextInput
            name="current_institution"
            maxLength={255}
            defaultValue={profile?.current_institution ?? ""}
          />
        </Field>
        <Field label="Current title">
          <TextInput
            name="current_title"
            maxLength={255}
            defaultValue={profile?.current_title ?? ""}
          />
        </Field>
      </div>

      <Hairline />

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Target degree">
          <Select
            name="target_degree_level"
            defaultValue={profile?.target_degree_level ?? ""}
          >
            <option value="">Not sure yet</option>
            {DEGREE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Target intake">
          <TextInput
            name="target_intake"
            maxLength={64}
            placeholder="Fall 2027"
            defaultValue={profile?.target_intake ?? ""}
          />
        </Field>
        <Field label="GPA or class">
          <TextInput name="gpa" maxLength={32} defaultValue={profile?.gpa ?? ""} />
        </Field>
        <Field label="Test scores" hint="GRE, IELTS, TOEFL — free text.">
          <TextInput name="test_scores" defaultValue={profile?.test_scores ?? ""} />
        </Field>
      </div>

      <div>
        <p className="section-label">Your fields</p>
        <CheckboxPills
          name="fields_of_study"
          options={FIELD_OPTIONS}
          defaultValues={profile?.fields_of_study ?? []}
        />
      </div>

      <Hairline />

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="LinkedIn URL" hint="Included in enquiry emails you send.">
          <TextInput
            name="linkedin_url"
            type="url"
            defaultValue={profile?.linkedin_url ?? ""}
          />
        </Field>
        <Field label="GitHub URL">
          <TextInput name="github_url" type="url" defaultValue={profile?.github_url ?? ""} />
        </Field>
        <Field label="Website">
          <TextInput name="website_url" type="url" defaultValue={profile?.website_url ?? ""} />
        </Field>
        <Field label="CV link" hint="A public link — included in enquiry emails.">
          <TextInput name="cv_url" type="url" defaultValue={profile?.cv_url ?? ""} />
        </Field>
      </div>

      <Hairline />

      <div className="rounded-card bg-mist p-6">
        <p className="section-label mb-4">Mentoring</p>
        <div className="space-y-5">
          <Toggle
            name="is_mentor"
            label="List me as a mentor"
            hint="You appear in the directory, can take mentorship requests, and can post opportunities."
            defaultChecked={profile?.is_mentor ?? false}
          />
          <Toggle
            name="mentor_is_accepting"
            label="Currently accepting new mentees"
            hint="Turn off when you are at capacity; your listing stays visible but requests are blocked."
            defaultChecked={profile?.mentor_is_accepting ?? true}
          />
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Years of experience">
              <TextInput
                name="years_experience"
                type="number"
                min={0}
                max={60}
                defaultValue={profile?.years_experience ?? ""}
              />
            </Field>
          </div>
          <div>
            <p className="section-label">What you can advise on</p>
            <CheckboxPills
              name="expertise"
              options={FIELD_OPTIONS}
              defaultValues={profile?.expertise ?? []}
            />
          </div>
          <Field label="Mentor bio" hint="Shown on your directory card.">
            <TextArea name="mentor_bio" rows={4} defaultValue={profile?.mentor_bio ?? ""} />
          </Field>
        </div>
      </div>

      <FormMessage state={state} />
      <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
    </form>
  );
}
