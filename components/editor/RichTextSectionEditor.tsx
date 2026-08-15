"use client";

import { useResumeStore } from "@/store/ResumeStoreProvider";
import { RichTextEditor } from "@/components/editor/rich-text/RichTextEditor";
import type { SectionData } from "@/types/resume";

export function RichTextSectionEditor({ section }: { section: SectionData }) {
  const setRichContent = useResumeStore((s) => s.setRichContent);

  return (
    <div className="max-w-2xl">
      <span className="block text-xs font-medium text-slate-500 mb-1.5">Content</span>
      <RichTextEditor
        variant="block"
        content={section.richContent}
        onChange={(doc) => setRichContent(section.id, doc)}
        placeholder="Technical Skills: Python | SQL | HTML | CSS…"
      />
    </div>
  );
}
