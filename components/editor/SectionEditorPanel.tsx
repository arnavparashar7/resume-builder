import { EducationSectionEditor } from "@/components/editor/EducationSectionEditor";
import { EntriesSectionEditor } from "@/components/editor/EntriesSectionEditor";
import { RichTextSectionEditor } from "@/components/editor/RichTextSectionEditor";
import type { SectionData } from "@/types/resume";

export function SectionEditorPanel({ section }: { section: SectionData }) {
  if (section.type === "EDUCATION") return <EducationSectionEditor section={section} />;
  if (section.type === "ENTRIES") return <EntriesSectionEditor section={section} />;
  return <RichTextSectionEditor section={section} />;
}
