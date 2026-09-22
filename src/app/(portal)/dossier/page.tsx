import { ai, serviceHealth } from "@/lib/ai-api";
import { ApiError } from "@/lib/api";
import { DocumentRow } from "./document-row";
import { UploadButton } from "@/components/upload-dialog";
import { Banner, EmptyState, Hairline, PillLink, SectionLabel, StatTile } from "@/components/ui";
import { kindLabel } from "@/lib/document-kinds";
import type { DocumentList, DocumentStats } from "@/types/ai";

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

  let documents: DocumentList = { items: [], total: 0 };
  let stats: DocumentStats | null = null;
  let loadError: string | null = null;

  try {
    [documents, stats] = await Promise.all([ai.documents(), ai.documentStats()]);
  } catch (error) {
    loadError = error instanceof ApiError ? error.message : "Could not load your documents.";
  }

  const embeddingsMissing = docHealth?.checks?.embeddings?.startsWith("missing");

  return (
    <div className="py-12">
      <SectionLabel>Your application file</SectionLabel>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="heading-lg mb-3">Dossier</h1>
          <p className="prose-column text-[15px] text-pewter">
            Your CV, statement of purpose, motivation letter, recommendations and
            transcripts. Counsel answers from these, and this is what the Committee
            reads.
          </p>
        </div>
        <UploadButton driveConfigured={driveConfigured} />
      </div>

      {docHealth === null ? (
        <div className="mb-8">
          <Banner tone="error">
            The document service is not running. Start it with{" "}
            <code className="text-[12px]">
              uvicorn doc_service.main:app --port 8001
            </code>{" "}
            from the services directory.
          </Banner>
        </div>
      ) : embeddingsMissing ? (
        <div className="mb-8">
          <Banner tone="warning">
            <strong>OPENAI_API_KEY is not set.</strong> Uploads will parse but cannot be
            indexed, so Counsel will not be able to search them. OpenRouter has no
            embeddings endpoint, which is why this key is separate. Add it to{" "}
            <code className="text-[12px]">services/.env</code> and restart doc-service.
          </Banner>
        </div>
      ) : null}

      {loadError ? (
        <div className="mb-8">
          <Banner tone="error">{loadError}</Banner>
        </div>
      ) : null}

      {stats && stats.total_documents > 0 ? (
        <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Documents" value={stats.total_documents} />
          <StatTile
            label="Words indexed"
            value={stats.total_words.toLocaleString()}
            hint="Searchable by Counsel"
          />
          <StatTile
            label="Types covered"
            value={Object.keys(stats.by_kind).length}
            hint={Object.keys(stats.by_kind).map(kindLabel).join(", ")}
          />
          <StatTile
            label="Ready to review"
            value={documents.items.filter((d) => d.status === "indexed").length}
          />
        </div>
      ) : null}

      <section>
        <SectionLabel>Uploaded</SectionLabel>
        <h2 className="heading mb-6">Your documents</h2>

        {documents.items.length === 0 ? (
          <EmptyState
            title="Nothing uploaded yet"
            body="Start with your CV and your statement of purpose — those two carry most of the weight in a committee's reading."
            action={<UploadButton driveConfigured={driveConfigured} />}
          />
        ) : (
          <ul>
            {documents.items.map((document) => (
              <DocumentRow key={document.id} document={document} />
            ))}
            <Hairline />
          </ul>
        )}
      </section>
    </div>
  );
}
