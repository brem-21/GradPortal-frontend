import { ai, serviceHealth } from "@/lib/ai-api";
import { ApiError } from "@/lib/api";
import { DossierBoard } from "./dossier-board";
import { UploadButton } from "@/components/upload-dialog";
import { Banner, SectionLabel } from "@/components/ui";
import type { AppDocument } from "@/types/ai";

export const metadata = { title: "Dossier — GradPortal" };
export const dynamic = "force-dynamic";

export default async function DossierPage() {
  // Drive needs a browser-visible client id and API key; without them the
  // option renders disabled rather than dead.
  const driveConfigured = Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
  );

  const health = await serviceHealth();
  const docHealth = health.doc;

  let documents: AppDocument[] = [];
  let loadError: string | null = null;
  try {
    documents = (await ai.documents()).items;
  } catch (error) {
    loadError = error instanceof ApiError ? error.message : "Could not load your documents.";
  }

  const embeddingsMissing = docHealth?.checks?.embeddings?.startsWith("missing");

  return (
    <div className="py-10">
      {/* Title, purpose and the primary action on one line: the list should
          start near the top of the viewport, not below a block of prose. */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <SectionLabel>Your application file</SectionLabel>
          <h1 className="text-[36px] font-light leading-[1.1] tracking-[-0.72px]">
            Dossier
          </h1>
          <p className="prose-column mt-1.5 text-[13px] leading-relaxed text-pewter">
            Counsel answers from these, and this is what the Committee reads.
            Select any document to read it.
          </p>
        </div>
        <UploadButton driveConfigured={driveConfigured} />
      </div>

      {docHealth === null ? (
        <div className="mb-6">
          <Banner tone="error">
            The document service is not running. Start it with{" "}
            <code className="text-[12px]">./run-all.sh</code> in the backend repo.
          </Banner>
        </div>
      ) : embeddingsMissing ? (
        <div className="mb-6">
          <Banner tone="warning">
            <strong>No embeddings key is set.</strong> Uploads will parse but cannot be
            indexed. Set <code className="text-[12px]">OPENROUTER_API_KEY</code> in{" "}
            <code className="text-[12px]">services/.env</code> and restart doc-service.
          </Banner>
        </div>
      ) : null}

      {loadError ? (
        <div className="mb-6">
          <Banner tone="error">{loadError}</Banner>
        </div>
      ) : null}

      <DossierBoard documents={documents} driveConfigured={driveConfigured} />
    </div>
  );
}
