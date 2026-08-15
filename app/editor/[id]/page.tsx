import { notFound } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { getResumeData } from "@/lib/resume/sync";
import { ResumeStoreProvider } from "@/store/ResumeStoreProvider";
import { EditorShell } from "@/components/editor/EditorShell";

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const resume = await getResumeData(id, userId);
  if (!resume) notFound();

  return (
    <ResumeStoreProvider resume={resume}>
      <EditorShell resumeId={id} />
    </ResumeStoreProvider>
  );
}
