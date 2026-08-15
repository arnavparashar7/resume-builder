import { getCurrentUserId } from "@/lib/auth";
import { listResumes } from "@/lib/resume/sync";
import { Dashboard } from "@/components/dashboard/Dashboard";

interface ResumeListRow {
  id: string;
  title: string;
  templateId: string;
  updatedAt: Date;
  createdAt: Date;
}

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  const resumes = (await listResumes(userId)) as ResumeListRow[];

  return (
    <Dashboard
      initialResumes={resumes.map((r) => ({
        id: r.id,
        title: r.title,
        templateId: r.templateId,
        updatedAt: r.updatedAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
