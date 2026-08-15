"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Copy, Trash2, Download, Pencil, Loader2 } from "lucide-react";
import clsx from "clsx";

export interface ResumeListItem {
  id: string;
  title: string;
  templateId: string;
  updatedAt: string;
  createdAt: string;
}

export function ResumeCard({
  resume,
  onRename,
  onDuplicate,
  onDelete,
}: {
  resume: ResumeListItem;
  onRename: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const openEditor = () => router.push(`/editor/${resume.id}`);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch(`/api/resumes/${resume.id}/pdf`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume.title || "resume"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      await onDuplicate(resume.id);
    } finally {
      setDuplicating(false);
    }
  };

  const handleDelete = () => {
    if (confirm(`Delete "${resume.title}"? This can't be undone.`)) {
      onDelete(resume.id);
    }
  };

  return (
    <div className="group flex items-center gap-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 px-3 py-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      {renaming ? (
        <input
          autoFocus
          defaultValue={resume.title}
          onBlur={(e) => {
            onRename(resume.id, e.target.value.trim() || resume.title);
            setRenaming(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setRenaming(false);
          }}
          className="flex-1 min-w-0 text-sm font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      ) : (
        <button onClick={openEditor} className="flex-1 min-w-0 text-left px-1 py-0.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <div className="font-medium text-slate-800 dark:text-slate-100 truncate">{resume.title}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Edited {formatDistanceToNow(new Date(resume.updatedAt), { addSuffix: true })}
          </div>
        </button>
      )}

      <div className="flex items-center gap-0.5 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100 transition-opacity">
        {exportError && (
          <span className="text-xs text-red-600 max-w-[140px] truncate mr-1" title={exportError}>
            {exportError}
          </span>
        )}
        <IconButton title="Rename" onClick={() => setRenaming(true)}>
          <Pencil size={14} />
        </IconButton>
        <IconButton title="Duplicate" onClick={handleDuplicate} loading={duplicating}>
          <Copy size={14} />
        </IconButton>
        <IconButton title="Export PDF" onClick={handleExport} loading={exporting}>
          <Download size={14} />
        </IconButton>
        <IconButton title="Delete" onClick={handleDelete} danger>
          <Trash2 size={14} />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  title,
  danger,
  loading,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={loading}
      onClick={onClick}
      className={clsx(
        "p-1.5 rounded text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-50 transition-colors",
        danger && "hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 dark:hover:text-red-400"
      )}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : children}
    </button>
  );
}
