import Link from "next/link";
import { api } from "@/lib/api";
import { markAllReadAction } from "@/lib/actions";
import { EmptyState, Hairline, PillLink, SectionLabel, Tag, cx } from "@/components/ui";
import { formatRelative, titleCase } from "@/lib/format";

export const metadata = { title: "Notifications — GradPortal" };
export const dynamic = "force-dynamic";

const URGENT = new Set(["deadline_reminder", "outreach_failed"]);

export default async function NotificationsPage() {
  const results = await api.notifications({ page_size: 50 });
  const unread = results.items.filter((n) => !n.read_at).length;

  return (
    <div className="py-12">
      <SectionLabel>Activity</SectionLabel>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h1 className="heading-lg">Notifications</h1>
        {unread > 0 ? (
          <form
            action={async () => {
              "use server";
              // The form action contract wants void; the result is only used
              // for inline feedback elsewhere.
              await markAllReadAction();
            }}
          >
            <button
              type="submit"
              className="text-[13px] text-ink transition-colors hover:text-ember"
            >
              Mark all {unread} read
            </button>
          </form>
        ) : null}
      </div>

      {results.items.length === 0 ? (
        <EmptyState
          title="Nothing yet"
          body="New matches, approaching deadlines, mentorship replies and outreach results all land here — and in your inbox, at whatever frequency you chose."
          action={<PillLink href="/opportunities">Browse opportunities</PillLink>}
        />
      ) : (
        <ul>
          {results.items.map((notification) => {
            const body = (
              <div
                className={cx(
                  "hairline py-6",
                  !notification.read_at && "border-l-2 border-l-ember pl-4",
                )}
              >
                <div className="mb-1 flex flex-wrap items-center gap-3">
                  <Tag tone={URGENT.has(notification.type) ? "ember" : "outline"}>
                    {titleCase(notification.type)}
                  </Tag>
                  <span className="text-[12px] text-smoke">
                    {formatRelative(notification.created_at)}
                  </span>
                </div>
                <p className="text-[18px] font-normal leading-snug text-ink">
                  {notification.title}
                </p>
                {notification.body ? (
                  <p className="prose-column mt-1 text-[13px] leading-relaxed text-pewter">
                    {notification.body}
                  </p>
                ) : null}
              </div>
            );

            return (
              <li key={notification.id}>
                {notification.link ? (
                  <Link
                    href={notification.link}
                    className="block transition-opacity hover:opacity-70"
                  >
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
          <Hairline />
        </ul>
      )}
    </div>
  );
}
