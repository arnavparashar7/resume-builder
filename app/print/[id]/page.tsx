import { notFound } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { getResumeData } from "@/lib/resume/sync";
import { getTemplate } from "@/templates";

// NOTE on auth: this route calls getCurrentUserId() exactly like every other
// page/route in the app (see lib/auth.ts) - today that always resolves to
// the single seeded local user, so a Playwright browser context with no
// cookies still resolves the same "user" as the person's own browser. When
// real per-user auth is added, PDF generation will need Playwright's request
// to carry some form of server-to-server credential (e.g. a short-lived
// signed token appended to this URL) since it navigates as a fresh,
// unauthenticated browser context - this route is the one place that will
// need to change for that.
export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const resume = await getResumeData(id, userId);
  if (!resume) notFound();

  const { component: Template } = getTemplate(resume.templateId);
  return <Template data={resume} isPrintMode />;
}
