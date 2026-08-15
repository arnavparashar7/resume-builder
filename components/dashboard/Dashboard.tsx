"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ResumeCard, type ResumeListItem } from "@/components/dashboard/ResumeCard";
import { Button } from "@/components/ui/Button";
import { Plus, FileText } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { signOut } from "next-auth/react";

export function Dashboard({ initialResumes }: { initialResumes: ResumeListItem[] }) {
  const router = useRouter();
  const [resumes, setResumes] = useState(initialResumes);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/resumes", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed to create resume (${res.status})`);
      }
      const body = await res.json();
      router.push(`/editor/${body.resume.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create resume");
      setCreating(false);
    }
  };

  const handleRename = (id: string, title: string) => {
    setResumes((prev) => prev.map((r) => (r.id === id ? { ...r, title } : r)));
    fetch(`/api/resumes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }).catch(() => {
      // Best-effort: a failed rename here just means the next full save/load
      // will show the previous title. Not worth a blocking error for this.
    });
  };

  const handleDuplicate = async (id: string) => {
    const res = await fetch(`/api/resumes/${id}/duplicate`, { method: "POST" });
    if (!res.ok) return;
    const body = await res.json();
    setResumes((prev) => [
      { id: body.resume.id, title: body.resume.title, templateId: body.resume.templateId, updatedAt: body.resume.updatedAt, createdAt: body.resume.updatedAt },
      ...prev,
    ]);
  };

  const handleDelete = async (id: string) => {
    const previous = resumes;
    setResumes((prev) => prev.filter((r) => r.id !== id));
    const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
    if (!res.ok) setResumes(previous); // roll back on failure
  };

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-10 px-4 sm:px-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">My Resumes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Keep separate versions tailored to different roles.</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            Sign Out
          </Button>
          <div className="flex flex-col sm:items-end gap-1">
            <Button variant="primary" onClick={handleCreate} disabled={creating}>
              <Plus size={15} /> {creating ? "Creating…" : "Create Resume"}
            </Button>
            {createError && <span className="text-xs text-red-600">{createError}</span>}
          </div>
        </div>
      </div>

      {resumes.length === 0 ? (
        <EmptyState onCreate={handleCreate} creating={creating} />
      ) : (
        <div className="space-y-2">
          {resumes.map((r) => (
            <ResumeCard key={r.id} resume={r} onRename={handleRename} onDuplicate={handleDuplicate} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onCreate, creating }: { onCreate: () => void; creating: boolean }) {
  return (
    <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl py-16 flex flex-col items-center text-center">
      <FileText className="text-slate-300 dark:text-slate-600 mb-3" size={32} />
      <p className="text-slate-600 dark:text-slate-300 font-medium">No resumes yet</p>
      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 mb-4 max-w-xs">
        Create your first resume to get started - you can make as many versions as you need.
      </p>
      <Button variant="primary" onClick={onCreate} disabled={creating}>
        <Plus size={15} /> {creating ? "Creating…" : "Create Resume"}
      </Button>
    </div>
  );
}
