import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell flex min-h-screen flex-col justify-center">
      <p className="section-label">404</p>
      <h1 className="heading-lg prose-column mb-6">
        That page is not here.
      </h1>
      <p className="prose-column mb-8 text-[15px] text-pewter">
        The opportunity may have been removed, or the link may be wrong.
      </p>
      <Link href="/overview" className="text-[15px] text-ember hover:underline">
        Back to the portal →
      </Link>
    </main>
  );
}
