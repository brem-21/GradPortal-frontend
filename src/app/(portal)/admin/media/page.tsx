import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { MediaGrid, MediaUploader } from "./media-manager";
import { Banner, SectionLabel } from "@/components/ui";

export const metadata = { title: "Site media — GradPortal" };
export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const me = await api.me();
  if (me.role !== "admin") redirect("/overview");

  let slots = await api.mediaSlots().catch(() => []);
  let assets: Awaited<ReturnType<typeof api.mediaAssets>> = { items: [], total: 0 };
  let error: string | null = null;

  try {
    assets = await api.mediaAssets();
  } catch (exception) {
    error = exception instanceof ApiError ? exception.message : "Could not load media.";
  }
  if (slots.length === 0) slots = [];

  return (
    <div className="py-12">
      <SectionLabel>Site content</SectionLabel>
      <h1 className="heading-lg mb-4">Background media</h1>
      <p className="prose-column mb-10 text-[15px] text-pewter">
        Everything behind the hero, the closing band, the footer, the sign-in page and
        the photo gallery. Assign a file to as many places as you like; each rotates
        through whatever it has.
      </p>

      {error ? (
        <div className="mb-8">
          <Banner tone="error">{error}</Banner>
        </div>
      ) : null}

      <MediaUploader slots={slots} />

      <section>
        <SectionLabel>Library</SectionLabel>
        <h2 className="heading mb-6">
          {assets.total} item{assets.total === 1 ? "" : "s"}
        </h2>
        <MediaGrid assets={assets.items} slots={slots} />
      </section>
    </div>
  );
}
