import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth, signOut } from "@/auth";
import { NotAuthenticatedError, api } from "@/lib/api";
import { ai } from "@/lib/ai-api";
import { ConfirmProvider } from "@/components/confirm-dialog";
import { CounselProvider } from "@/components/counsel";
import { ProgressRail } from "@/components/progress-rail";
import { Sidebar } from "@/components/sidebar";
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
          <code className="rounded-small bg-mist px-1.5 py-0.5 text-[13px]">./run-all.sh</code>{" "}
          in the backend repo, then reload this page.
        </p>
        <p className="mt-4 text-[12px] text-smoke">
          {error instanceof Error ? error.message : String(error)}
        </p>
      </main>
    );
  }

  // Counsel needs to know whether there is anything to ground answers in, but a
  // slow doc-service must never block the whole portal from rendering.
  const documents = await ai.documents().catch(() => ({ items: [], total: 0 }));
  const hasDocuments = documents.items.some((document) => document.status === "indexed");

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <Suspense fallback={null}>
      <ProgressRail>
        <ConfirmProvider>
          <CounselProvider hasDocuments={hasDocuments}>
            <div className="flex min-h-screen bg-paper">
              <Sidebar
                role={me.role}
                unread={me.unread_notifications}
                fullName={me.full_name}
                email={me.email}
                avatarUrl={me.avatar_url}
                signOutAction={handleSignOut}
              />

              <div className="min-w-0 flex-1">
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
                      Add a profile picture — contacts and mentors reply far more often
                      to a profile that shows a real person.{" "}
                      <Link href="/profile" className="text-ember hover:underline">
                        Add a photo →
                      </Link>
                    </div>
                  </div>
                ) : null}

                <main className="page-shell pb-28">{children}</main>
              </div>
            </div>
          </CounselProvider>
        </ConfirmProvider>
      </ProgressRail>
    </Suspense>
  );
}
