import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { SubmitForm } from "./submit-form";
import { SectionLabel } from "@/components/ui";

export const metadata = { title: "Post an opportunity — GradPortal" };
export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const me = await api.me();
  if (me.role !== "mentor" && me.role !== "admin") redirect("/overview");

  const isAdmin = me.role === "admin";

  return (
    <div className="py-12">
      <SectionLabel>Contribute</SectionLabel>
      <h1 className="heading-lg mb-4">Post an opportunity</h1>
      <p className="prose-column mb-12 text-[15px] text-pewter">
        {isAdmin
          ? "As a community admin, what you post publishes immediately and notifies every member whose interests match it."
          : "Mentor submissions go to the review queue. A community admin approves them, and everyone whose interests match is then notified."}
      </p>
      <SubmitForm />
    </div>
  );
}
