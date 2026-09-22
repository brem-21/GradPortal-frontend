import { api } from "@/lib/api";
import { RespondControls } from "./respond-controls";
import { EmptyState, Hairline, PillLink, SectionLabel, Tag } from "@/components/ui";
import { formatRelative, titleCase } from "@/lib/format";
import type { MentorshipRequest } from "@/types/api";

export const metadata = { title: "Mentorship — GradPortal" };
export const dynamic = "force-dynamic";

function RequestRow({
  request,
  perspective,
}: {
  request: MentorshipRequest;
  perspective: "mentor" | "mentee";
}) {
  const other = perspective === "mentor" ? request.mentee : request.mentor;
  const accepted = request.status === "accepted";

  return (
    <li className="hairline py-7 first:border-t-0 first:pt-0">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <Tag tone={accepted ? "ember" : "outline"}>{titleCase(request.status)}</Tag>
        <span className="text-[12px] text-smoke">
          {formatRelative(request.created_at)}
        </span>
      </div>

      <p className="text-[18px] text-ink">
        {perspective === "mentor" ? "From" : "To"} {other.full_name ?? other.email}
      </p>
      {request.topic ? (
        <p className="mt-1 text-[13px] text-pewter">{request.topic}</p>
      ) : null}

      <p className="prose-column mt-3 whitespace-pre-wrap text-[15px] leading-[1.5] text-ink">
        {request.message}
      </p>

      {request.response_message ? (
        <p className="prose-column mt-4 border-l-2 border-mist pl-4 text-[13px] italic text-pewter">
          {request.response_message}
        </p>
      ) : null}

      {/* The email address is the handoff: once accepted, they talk directly. */}
      {accepted ? (
        <p className="mt-4 text-[13px]">
          Connected —{" "}
          <a href={`mailto:${other.email}`} className="text-ember hover:underline">
            {other.email}
          </a>
        </p>
      ) : null}

      {perspective === "mentor" && request.status === "pending" ? (
        <RespondControls requestId={request.id} />
      ) : null}
    </li>
  );
}

export default async function MentorshipPage() {
  const [me, received, sent] = await Promise.all([
    api.me(),
    api.mentorshipRequests({ role: "received", page_size: 50 }),
    api.mentorshipRequests({ role: "sent", page_size: 50 }),
  ]);

  const isMentor = me.profile?.is_mentor ?? false;
  const pendingCount = received.items.filter((r) => r.status === "pending").length;

  return (
    <div className="py-12">
      <SectionLabel>Your conversations</SectionLabel>
      <h1 className="heading-lg mb-12">Mentorship</h1>

      {isMentor ? (
        <section className="mb-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h2 className="heading">Requests to you</h2>
            {pendingCount > 0 ? (
              <p className="text-[13px] text-ember">
                {pendingCount} awaiting your reply
              </p>
            ) : null}
          </div>
          {received.items.length === 0 ? (
            <EmptyState
              title="No requests yet"
              body="You appear in the mentor directory. When an applicant writes, their request lands here and in your inbox."
              action={<PillLink href="/mentors">See how your listing looks</PillLink>}
            />
          ) : (
            <ul>
              {received.items.map((request) => (
                <RequestRow key={request.id} request={request} perspective="mentor" />
              ))}
              <Hairline />
            </ul>
          )}
        </section>
      ) : null}

      <section>
        <h2 className="heading mb-6">Requests you sent</h2>
        {sent.items.length === 0 ? (
          <EmptyState
            title="You have not asked anyone yet"
            body="Mentors in the directory have been through this process in your field. A specific question gets a far better answer than a general one."
            action={<PillLink href="/mentors">Browse mentors</PillLink>}
          />
        ) : (
          <ul>
            {sent.items.map((request) => (
              <RequestRow key={request.id} request={request} perspective="mentee" />
            ))}
            <Hairline />
          </ul>
        )}
      </section>
    </div>
  );
}
