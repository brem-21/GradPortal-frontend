import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { NotAuthenticatedError, api } from "@/lib/api";
import { TopNav } from "@/components/top-nav";
import type { Me } from "@/types/api";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  let me: Me;
  try {
    me = await api.me();
  } catch (error) {
    if (error instanceof NotAuthenticatedError) redirect("/signin");
    return (
      <main className="page-shell flex min-h-screen flex-col items-start justify-center">
        <p className="section-label">Backend unreachable</p>
        <h1 className="heading mb-4">The API is not responding.</h1>
        <p className="prose-column text-[15px] text-pewter">
          Start it with{" "}
          <code className="rounded-small bg-mist px-1.5 py-0.5 text-[13px]">
            uvicorn app.main:app --reload
          </code>{" "}
          from the backend directory, then reload this page.
        </p>
        <p className="mt-4 text-[12px] text-smoke">
          {error instanceof Error ? error.message : String(error)}
        </p>
      </main>
    );
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-screen bg-paper">
      <TopNav
        role={me.role}
        unread={me.unread_notifications}
        fullName={me.full_name}
        avatarUrl={me.avatar_url}
        signOutAction={handleSignOut}
      />

      {!me.onboarding_completed ? (
        <div className="page-shell pt-6">
          <div className="rounded-card border border-ember/30 px-4 py-[14px] text-[13px]">
            Finish setting up so the feed matches your interests.{" "}
            <Link href="/onboarding" className="text-ember hover:underline">
              Choose what you are looking for →
            </Link>
          </div>
        </div>
      ) : !me.avatar_url ? (
        <div className="page-shell pt-6">
          <div className="rounded-card border border-ember/30 px-4 py-[14px] text-[13px]">
            Add a profile picture — admissions contacts and mentors reply far more
            often to someone whose profile shows a real person.{" "}
            <Link href="/profile" className="text-ember hover:underline">
              Add a photo →
            </Link>
          </div>
        </div>
      ) : null}

      <main className="page-shell pb-24">{children}</main>
    </div>
  );
}
