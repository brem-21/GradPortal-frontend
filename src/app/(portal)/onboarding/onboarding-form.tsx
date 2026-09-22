"use client";

import { useActionState } from "react";
import { IDLE } from "@/lib/action-state";
import { completeOnboardingAction } from "@/lib/actions";
import { AvatarField } from "@/components/avatar-field";
import {
  CheckboxPills,
  Field,
  FormMessage,
  Select,
  SubmitButton,
  TextInput,
  Toggle,
} from "@/components/form";
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

export function OnboardingForm({
  defaultFields,
  defaultTypes,
  defaultDegrees,
  defaultCountries,
  defaultRegions,
  defaultFunding,
  defaultDigest,
  isMentor,
  providerAvatar,
}: {
  defaultFields: string[];
  defaultTypes: string[];
  defaultDegrees: string[];
  defaultCountries: string[];
  defaultRegions: string[];
  defaultFunding: string[];
  defaultDigest: string;
  isMentor: boolean;
  providerAvatar: string | null;
}) {
  const [state, action] = useActionState(completeOnboardingAction, IDLE);

  return (
    <form action={action} className="py-12">
      <SectionLabel>Step one</SectionLabel>
      <h1 className="heading-lg prose-column mb-4">What are you looking for?</h1>
      <p className="prose-column mb-12 text-[15px] text-pewter">
        This decides what lands in your feed and what you get emailed about. You can
        change all of it later from your profile.
      </p>

      <div className="space-y-12">
        <section>
          <SectionLabel>Required</SectionLabel>
          <h2 className="text-[22px] font-light tracking-[-0.44px]">
            Type of opportunity
          </h2>
          <CheckboxPills
            name="opportunity_types"
            options={TYPE_OPTIONS}
            defaultValues={defaultTypes}
          />
        </section>

        <Hairline />

        <section>
          <SectionLabel>Required</SectionLabel>
          <h2 className="text-[22px] font-light tracking-[-0.44px]">Fields</h2>
          <p className="mt-1 text-[13px] text-pewter">
            The portal only covers these five.
          </p>
          <CheckboxPills
            name="fields_of_study"
            options={FIELD_OPTIONS}
            defaultValues={defaultFields}
          />
        </section>

        <Hairline />

        <section>
          <SectionLabel>Optional — leave blank for no restriction</SectionLabel>
          <h2 className="text-[22px] font-light tracking-[-0.44px]">Narrow it down</h2>

          <div className="mt-6 space-y-8">
            <div>
              <p className="section-label">Degree level</p>
              <CheckboxPills
                name="degree_levels"
                options={DEGREE_OPTIONS}
                defaultValues={defaultDegrees}
              />
            </div>
            <div>
              <p className="section-label">Funding</p>
              <CheckboxPills
                name="funding_types"
                options={FUNDING_OPTIONS}
                defaultValues={defaultFunding}
              />
            </div>
            <div>
              <p className="section-label">Regions</p>
              <CheckboxPills
                name="regions"
                options={REGION_OPTIONS}
                defaultValues={defaultRegions}
              />
            </div>
            <div>
              <p className="section-label">Or specific countries</p>
              <CheckboxPills
                name="countries"
                options={COUNTRY_SUGGESTIONS.map((c) => ({ value: c, label: c }))}
                defaultValues={defaultCountries}
              />
            </div>
          </div>
        </section>

        <Hairline />

        <section className="rounded-card border border-mist p-6">
          <SectionLabel>Required</SectionLabel>
          <h2 className="mb-1 text-[22px] font-light tracking-[-0.44px]">
            Your profile picture
          </h2>
          <p className="prose-column mb-5 text-[13px] text-pewter">
            Admissions contacts and mentors reply far more often to someone whose
            profile shows a real person. This is the single biggest thing you can do
            to make a cold enquiry land.
          </p>
          <AvatarField initial={providerAvatar} />
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Field label="Headline" hint="Shown to contacts and mentors.">
            <TextInput
              name="headline"
              placeholder="Final-year CS student aiming for an AI master's"
              maxLength={255}
            />
          </Field>
          <Field label="Where you are now">
            <TextInput name="country" placeholder="Ghana" maxLength={100} />
          </Field>
          <Field label="Current institution or employer">
            <TextInput
              name="current_institution"
              placeholder="KNUST"
              maxLength={255}
            />
          </Field>
          <Field label="Email updates">
            <Select name="email_digest" defaultValue={defaultDigest}>
              {DIGEST_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </section>

        <Hairline />

        <section className="rounded-card bg-mist p-6">
          <Toggle
            name="join_as_mentor"
            label="I want to mentor other applicants"
            hint="Mentors appear in the directory, can take mentorship requests, and can post opportunities they hear about."
            defaultChecked={isMentor}
          />
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Field label="Years of experience">
              <TextInput
                name="years_experience"
                type="number"
                min={0}
                max={60}
                placeholder="5"
              />
            </Field>
            <div>
              <p className="section-label">What you can advise on</p>
              <CheckboxPills name="expertise" options={FIELD_OPTIONS} />
            </div>
          </div>
        </section>

        <FormMessage state={state} />

        <div className="flex items-center gap-6">
          <SubmitButton pendingLabel="Saving…">Save and see opportunities</SubmitButton>
        </div>
      </div>
    </form>
  );
}
