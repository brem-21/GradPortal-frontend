import { redirect } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { StoryForm, StoryList } from "./story-manager";
import { Banner, SectionLabel } from "@/components/ui";

export const metadata = { title: "Success stories — GradPortal" };
export const dynamic = "force-dynamic";

export default async function AdminStoriesPage() {
  const me = await api.me();
  if (me.role !== "admin") redirect("/overview");

  let stories: Awaited<ReturnType<typeof api.adminStories>> = { items: [], total: 0 };
  let error: string | null = null;
  try {
    stories = await api.adminStories();
  } catch (exception) {
    error = exception instanceof ApiError ? exception.message : "Could not load stories.";
  }

  const published = stories.items.filter((story) => story.published).length;

  return (
    <div className="py-12">
      <SectionLabel>Site content</SectionLabel>
      <h1 className="heading-lg mb-4">Success stories</h1>
      <p className="prose-column mb-10 text-[15px] text-pewter">
        Shown on the landing page and the overview. {published} of {stories.total}{" "}
        published — the carousel stays hidden entirely until at least one is.
      </p>

      {error ? (
        <div className="mb-8">
          <Banner tone="error">{error}</Banner>
        </div>
      ) : null}

      <StoryForm />

      <section>
        <SectionLabel>All stories</SectionLabel>
        <h2 className="heading mb-6">Library</h2>
        <StoryList stories={stories.items} />
      </section>
    </div>
  );
}
