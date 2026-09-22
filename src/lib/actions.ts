"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { ApiError, api, apiFetch } from "@/lib/api";

function fail(error: unknown): ActionState {
  if (error instanceof ApiError) return { ok: false, message: error.message };
  console.error("[action]", error);
  return { ok: false, message: "Something went wrong. Try again." };
}

function values(form: FormData, key: string): string[] {
  return form.getAll(key).map(String).filter(Boolean);
}

function text(form: FormData, key: string): string | null {
  const value = form.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/* ---------------- Onboarding ---------------- */

export async function completeOnboardingAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const opportunityTypes = values(form, "opportunity_types");
  const fields = values(form, "fields_of_study");

  if (opportunityTypes.length === 0) {
    return { ok: false, message: "Pick at least one type of opportunity." };
  }
  if (fields.length === 0) {
    return { ok: false, message: "Pick at least one field." };
  }

  try {
    await api.completeOnboarding({
      opportunity_types: opportunityTypes,
      fields_of_study: fields,
      degree_levels: values(form, "degree_levels"),
      countries: values(form, "countries"),
      regions: values(form, "regions"),
      funding_types: values(form, "funding_types"),
      email_digest: text(form, "email_digest") ?? "daily",
      avatar_url: text(form, "avatar_url") ?? "",
      headline: text(form, "headline"),
      country: text(form, "country"),
      current_institution: text(form, "current_institution"),
      join_as_mentor: form.get("join_as_mentor") === "on",
      years_experience: text(form, "years_experience")
        ? Number(text(form, "years_experience"))
        : null,
      expertise: values(form, "expertise"),
    });
  } catch (error) {
    return fail(error);
  }

  revalidatePath("/", "layout");
  redirect("/overview");
}

/* ---------------- Profile & preferences ---------------- */

export async function updateProfileAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await api.updateProfile({
      avatar_url: text(form, "avatar_url"),
      headline: text(form, "headline"),
      bio: text(form, "bio"),
      country: text(form, "country"),
      city: text(form, "city"),
      current_institution: text(form, "current_institution"),
      current_title: text(form, "current_title"),
      linkedin_url: text(form, "linkedin_url"),
      github_url: text(form, "github_url"),
      website_url: text(form, "website_url"),
      cv_url: text(form, "cv_url"),
      target_degree_level: text(form, "target_degree_level"),
      target_intake: text(form, "target_intake"),
      fields_of_study: values(form, "fields_of_study"),
      gpa: text(form, "gpa"),
      test_scores: text(form, "test_scores"),
      is_mentor: form.get("is_mentor") === "on",
      mentor_is_accepting: form.get("mentor_is_accepting") === "on",
      years_experience: text(form, "years_experience")
        ? Number(text(form, "years_experience"))
        : null,
      expertise: values(form, "expertise"),
      mentor_bio: text(form, "mentor_bio"),
    });
  } catch (error) {
    return fail(error);
  }

  revalidatePath("/profile");
  revalidatePath("/mentors");
  return { ok: true, message: "Profile saved." };
}

export async function updatePreferencesAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await api.updatePreferences({
      opportunity_types: values(form, "opportunity_types"),
      fields_of_study: values(form, "fields_of_study"),
      degree_levels: values(form, "degree_levels"),
      countries: values(form, "countries"),
      regions: values(form, "regions"),
      funding_types: values(form, "funding_types"),
      email_digest: text(form, "email_digest") ?? "daily",
      email_notifications_enabled: form.get("email_notifications_enabled") === "on",
      deadline_reminder_days: values(form, "deadline_reminder_days").map(Number),
    });
  } catch (error) {
    return fail(error);
  }

  revalidatePath("/profile");
  revalidatePath("/overview");
  revalidatePath("/opportunities");
  return { ok: true, message: "Preferences saved." };
}

/* ---------------- Saving / tracker ---------------- */

export async function saveOpportunityAction(
  opportunityId: string,
  status: string,
  notes?: string | null,
): Promise<ActionState> {
  try {
    await api.save(opportunityId, { status, notes: notes ?? null });
  } catch (error) {
    return fail(error);
  }
  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/opportunities");
  revalidatePath("/shortlist");
  revalidatePath("/overview");
  return { ok: true, message: "Saved." };
}

export async function unsaveOpportunityAction(opportunityId: string): Promise<ActionState> {
  try {
    await api.unsave(opportunityId);
  } catch (error) {
    return fail(error);
  }
  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/opportunities");
  revalidatePath("/shortlist");
  revalidatePath("/overview");
  return { ok: true, message: "Removed." };
}

/* ---------------- Outreach ---------------- */

export async function sendOutreachAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const opportunityId = text(form, "opportunity_id");
  const toEmail = text(form, "to_email");
  const subject = text(form, "subject");
  const body = text(form, "body");

  if (!opportunityId || !toEmail || !subject || !body) {
    return { ok: false, message: "Recipient, subject and message are all required." };
  }

  try {
    await api.sendEmail({
      opportunity_id: opportunityId,
      contact_id: text(form, "contact_id"),
      to_email: toEmail,
      subject,
      body,
      cc_self: form.get("cc_self") === "on",
    });
  } catch (error) {
    return fail(error);
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/overview");
  return { ok: true, message: `Sent to ${toEmail} from your own mailbox.` };
}

/* ---------------- Mentorship ---------------- */

export async function requestMentorshipAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const mentorId = text(form, "mentor_id");
  const message = text(form, "message");

  if (!mentorId) return { ok: false, message: "Missing mentor." };
  if (!message || message.length < 10) {
    return { ok: false, message: "Write at least a sentence about what you need." };
  }

  try {
    await api.requestMentorship({
      mentor_id: mentorId,
      topic: text(form, "topic"),
      message,
    });
  } catch (error) {
    return fail(error);
  }

  revalidatePath("/mentors");
  revalidatePath("/mentorship");
  return { ok: true, message: "Request sent. The mentor has been notified." };
}

export async function respondToMentorshipAction(
  requestId: string,
  status: "accepted" | "declined",
  responseMessage?: string | null,
): Promise<ActionState> {
  try {
    await api.respondToMentorship(requestId, {
      status,
      response_message: responseMessage ?? null,
    });
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/mentorship");
  return { ok: true, message: status === "accepted" ? "Accepted." : "Declined." };
}

/* ---------------- Notifications ---------------- */

export async function markAllReadAction(): Promise<ActionState> {
  try {
    await api.markAllNotificationsRead();
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { ok: true, message: "All caught up." };
}

export async function markReadAction(id: string): Promise<ActionState> {
  try {
    await api.markNotificationRead(id);
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { ok: true, message: null };
}

/* ---------------- Contribute an opportunity ---------------- */

export async function createOpportunityAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const title = text(form, "title");
  const url = text(form, "url");
  const type = text(form, "opportunity_type");
  const fields = values(form, "fields_of_study");

  if (!title) return { ok: false, message: "Give the opportunity a title." };
  if (!url) return { ok: false, message: "A link to the original listing is required." };
  if (!type) return { ok: false, message: "Pick an opportunity type." };
  if (fields.length === 0) return { ok: false, message: "Pick at least one field." };

  const contactEmail = text(form, "contact_email");

  try {
    await api.createOpportunity({
      title,
      url,
      description: text(form, "description") ?? "",
      summary: text(form, "summary"),
      opportunity_type: type,
      fields_of_study: fields,
      degree_levels: values(form, "degree_levels"),
      organization: text(form, "organization"),
      department: text(form, "department"),
      location: text(form, "location"),
      country: text(form, "country"),
      is_remote: form.get("is_remote") === "on",
      funding_type: text(form, "funding_type") ?? "unknown",
      funding_amount: text(form, "funding_amount"),
      open_to_international: form.get("open_to_international") === "on" ? true : null,
      application_deadline: text(form, "application_deadline"),
      deadline_text: text(form, "deadline_text"),
      apply_url: text(form, "apply_url"),
      contacts: contactEmail
        ? [
            {
              name: text(form, "contact_name"),
              role: text(form, "contact_role"),
              email: contactEmail,
              is_primary: true,
            },
          ]
        : [],
    });
  } catch (error) {
    return fail(error);
  }

  revalidatePath("/opportunities");
  revalidatePath("/submit");
  return {
    ok: true,
    message:
      "Submitted. Admin posts go live immediately; mentor posts are queued for review.",
  };
}

/* ---------------- Admin: sources ---------------- */

export async function runSourceAction(id: string): Promise<ActionState> {
  try {
    const report = (await api.runSource(id)) as Record<string, unknown>;
    revalidatePath("/admin/sources");
    revalidatePath("/opportunities");
    const skipReason = report.skip_reason;
    if (report.status === "skipped" && typeof skipReason === "string") {
      return { ok: false, message: skipReason };
    }
    return {
      ok: true,
      message: `${report.status}: ${report.created} new, ${report.updated} updated, ${report.skipped_out_of_scope} out of scope.`,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function toggleSourceAction(id: string, enabled: boolean): Promise<ActionState> {
  try {
    await api.updateSource(id, { enabled });
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/admin/sources");
  return { ok: true, message: enabled ? "Source enabled." : "Source disabled." };
}

export async function runAllSourcesAction(): Promise<ActionState> {
  try {
    await api.runAllSources();
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/admin/sources");
  return { ok: true, message: "Crawl started. Refresh in a minute to see results." };
}

export async function seedSourcesAction(): Promise<ActionState> {
  try {
    await api.seedSources();
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/admin/sources");
  return { ok: true, message: "Starter catalogue seeded." };
}

/* ---------------- Catalogue freshness ---------------- */

export async function refreshOpportunitiesAction(): Promise<ActionState> {
  try {
    const result = (await api.refreshOpportunities()) as { detail?: string };
    revalidatePath("/opportunities");
    revalidatePath("/overview");
    return { ok: true, message: result?.detail ?? "Refresh started." };
  } catch (error) {
    return fail(error);
  }
}

/* ---------------- Admin: site media ---------------- */

function refreshSiteContent(): void {
  revalidateTag("site-media");
  revalidateTag("site-stories");
  revalidatePath("/", "layout");
  revalidatePath("/admin/media");
  revalidatePath("/admin/stories");
}

export async function updateMediaAction(
  id: string,
  body: Record<string, unknown>,
): Promise<ActionState> {
  try {
    await api.updateMedia(id, body);
  } catch (error) {
    return fail(error);
  }
  refreshSiteContent();
  return { ok: true, message: "Saved." };
}

export async function deleteMediaAction(id: string): Promise<ActionState> {
  try {
    await api.deleteMedia(id);
  } catch (error) {
    return fail(error);
  }
  refreshSiteContent();
  return { ok: true, message: "Media deleted." };
}

/* ---------------- Admin: success stories ---------------- */

export async function createStoryAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const name = text(form, "name");
  const outcome = text(form, "outcome");
  const quote = text(form, "quote");

  if (!name) return { ok: false, message: "Who is this story about?" };
  if (!outcome) return { ok: false, message: "State the outcome, e.g. 'Funded PhD · UK'." };
  if (!quote || quote.length < 10) {
    return { ok: false, message: "The quote needs to be at least a sentence." };
  }

  const published = form.get("published") === "on";
  const consent = form.get("consent_confirmed") === "on";
  if (published && !consent) {
    return {
      ok: false,
      message:
        "Confirm you have this person's permission before publishing. An unconsented testimonial is not publishable.",
    };
  }

  try {
    await api.createStory({
      name,
      outcome,
      quote,
      field: text(form, "field"),
      institution: text(form, "institution"),
      country: text(form, "country"),
      link_url: text(form, "link_url"),
      photo_path: text(form, "photo_path"),
      position: Number(text(form, "position") ?? 0) || 0,
      published,
      consent_confirmed: consent,
      consent_note: text(form, "consent_note"),
    });
  } catch (error) {
    return fail(error);
  }

  refreshSiteContent();
  return { ok: true, message: "Story added." };
}

export async function updateStoryAction(
  id: string,
  body: Record<string, unknown>,
): Promise<ActionState> {
  try {
    await api.updateStory(id, body);
  } catch (error) {
    return fail(error);
  }
  refreshSiteContent();
  return { ok: true, message: "Saved." };
}

export async function deleteStoryAction(id: string): Promise<ActionState> {
  try {
    await api.deleteStory(id);
  } catch (error) {
    return fail(error);
  }
  refreshSiteContent();
  return { ok: true, message: "Story deleted." };
}

/* ---------------- Account ---------------- */

export async function deactivateAccountAction(): Promise<ActionState> {
  try {
    await apiFetch<{ detail: string }>("/users/me", { method: "DELETE" });
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Account deactivated." };
}
