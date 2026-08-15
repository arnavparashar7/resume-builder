"use client";

import { useState } from "react";
import Link from "next/link";
import { useResumeStore } from "@/store/ResumeStoreProvider";
import { useAutosave } from "@/hooks/useAutosave";
import { SectionSidebar } from "@/components/editor/SectionSidebar";
import { SectionEditorPanel } from "@/components/editor/SectionEditorPanel";
import { PersonalInfoForm } from "@/components/editor/PersonalInfoForm";
import { ResumePreview } from "@/components/preview/ResumePreview";
import { SaveStatusBadge } from "@/components/ui/SaveStatusBadge";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ArrowLeft, PanelRightClose, PanelRightOpen, Download, Loader2, Menu, X } from "lucide-react";
import clsx from "clsx";

export function EditorShell({ resumeId }: { resumeId: string }) {
  useAutosave(resumeId);

  const resume = useResumeStore((s) => s.resume);
  const title = resume.title;
  const setTitle = useResumeStore((s) => s.setTitle);
  const sections = resume.sections;

  const [activeId, setActiveId] = useState<string>("personal-info");
  const [showPreview, setShowPreview] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const activeSection = sections.find((s) => s.id === activeId);

  const selectSection = (id: string) => {
    setActiveId(id);
    setMobileSidebarOpen(false);
  };

  const handleExportPdf = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/pdf`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "resume"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/dashboard" className="p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 shrink-0">
            <ArrowLeft size={16} />
          </Link>
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 shrink-0 lg:hidden"
            aria-label="Open sections menu"
          >
            <Menu size={16} />
          </button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm font-semibold text-slate-900 dark:text-slate-100 bg-transparent border-none outline-none focus:ring-0 truncate min-w-0 max-w-[40vw]"
            style={{ width: `${Math.max(title.length, 8)}ch` }}
          />
          <span className="hidden sm:inline">
            <SaveStatusBadge />
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {exportError && (
            <span className="hidden sm:inline text-xs text-red-600 max-w-[10rem] truncate" title={exportError}>
              {exportError}
            </span>
          )}
          <ThemeToggle />
          <div className="hidden lg:block">
            <Button variant="secondary" size="sm" onClick={() => setShowPreview((v) => !v)}>
              {showPreview ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
              {showPreview ? "Hide preview" : "Show preview"}
            </Button>
          </div>
          <Button variant="primary" size="sm" onClick={handleExportPdf} disabled={exporting}>
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span className="hidden sm:inline">{exporting ? "Exporting…" : "Export PDF"}</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 relative">
        {/* Mobile sidebar drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/30" onClick={() => setMobileSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white dark:bg-slate-900 shadow-xl flex flex-col">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sections</span>
                <button onClick={() => setMobileSidebarOpen(false)} className="p-1 rounded text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <SectionSidebar activeId={activeId} onSelect={selectSection} />
              </div>
            </div>
          </div>
        )}

        {/* Desktop persistent sidebar */}
        <aside className="hidden lg:block w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <SectionSidebar activeId={activeId} onSelect={selectSection} />
        </aside>

        <main
          className={clsx(
            "overflow-y-auto p-4 sm:p-6",
            showPreview ? "w-full lg:w-[440px] lg:shrink-0 lg:border-r lg:border-slate-200 dark:lg:border-slate-800" : "flex-1"
          )}
        >
          {activeId === "personal-info" && <PersonalInfoForm />}
          {activeSection && <SectionEditorPanel section={activeSection} />}
        </main>

        {showPreview && (
          <div className="flex-1 min-w-0 hidden lg:block">
            <ResumePreview data={resume} />
          </div>
        )}
      </div>
    </div>
  );
}
