import { api } from "@/lib/api";
import { RequestDialog } from "./request-dialog";
import { EmptyState, Hairline, PillLink, SectionLabel, Tag } from "@/components/ui";
import { fieldLabel } from "@/lib/format";

export const metadata = { title: "Mentors — GradPortal" };
export const dynamic = "force-dynamic";

export default async function MentorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [me, mentors] = await Promise.all([
    api.me(),
    api.mentors({ q, page_size: 50 }),
  ]);

  return (
    <div className="py-12">
      <SectionLabel>Community</SectionLabel>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="heading-lg">Mentors</h1>
        <p className="text-[13px] text-pewter">
          {mentors.total} {mentors.total === 1 ? "mentor" : "mentors"} taking requests
        </p>
      </div>

      <p className="prose-column mb-12 text-[15px] text-pewter">
        People who have already been through admissions, funding and visas in these
        fields. Ask them what a listing does not tell you.
      </p>

      {mentors.items.length === 0 ? (
        <EmptyState
          title="No mentors yet"
          body={
            me.profile?.is_mentor
              ? "You are listed as a mentor. Once others join, they appear here too."
              : "The directory fills as experienced applicants join. If you have made the move already, you could be the first."
          }
          action={<PillLink href="/profile">Become a mentor</PillLink>}
        />
      ) : (
        <ul>
          {mentors.items.map((mentor) => (
            <li key={mentor.user_id} className="hairline py-8 first:border-t-0 first:pt-0">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-3">
                    <h2 className="text-[22px] font-light tracking-[-0.44px] text-ink">
                      {mentor.full_name ?? "Mentor"}
                    </h2>
                    {!mentor.mentor_is_accepting ? (
                      <Tag tone="outline">At capacity</Tag>
                    ) : null}
                  </div>

                  <p className="text-[13px] text-pewter">
                    {[mentor.current_title, mentor.current_institution]
                      .filter(Boolean)
                      .join(" · ") || mentor.headline || "—"}
                    {mentor.country ? ` · ${mentor.country}` : ""}
                    {mentor.years_experience
                      ? ` · ${mentor.years_experience} yrs experience`
                      : ""}
                  </p>

                  {mentor.mentor_bio ? (
                    <p className="prose-column mt-3 text-[15px] leading-[1.5] text-ink">
                      {mentor.mentor_bio}
                    </p>
                  ) : mentor.headline ? (
                    <p className="prose-column mt-3 text-[15px] text-ink">
                      {mentor.headline}
                    </p>
                  ) : null}

                  {mentor.expertise.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {mentor.expertise.map((item) => (
                        <Tag key={item}>{fieldLabel(item)}</Tag>
                      ))}
                    </div>
                  ) : null}

                  {mentor.linkedin_url ? (
                    <a
                      href={mentor.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-[12px] text-ember hover:underline"
                    >
                      LinkedIn profile
                    </a>
                  ) : null}

                  {mentor.mentor_is_accepting && mentor.user_id !== me.id ? (
                    <div className="mt-5">
                      <RequestDialog
                        mentorId={mentor.user_id}
                        mentorName={mentor.full_name ?? "this mentor"}
                      />
                    </div>
                  ) : null}
                  {mentor.user_id === me.id ? (
                    <p className="mt-5 text-[12px] text-smoke">This is your listing.</p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
          <Hairline />
        </ul>
      )}
    </div>
  );
}
