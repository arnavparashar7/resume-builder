"use client";

import { useResumeStore } from "@/store/ResumeStoreProvider";
import { TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/editor/rich-text/RichTextEditor";
import { InlineEmptyState } from "@/components/ui/InlineEmptyState";
import { ChevronUp, ChevronDown, Trash2, Plus, GraduationCap } from "lucide-react";
import type { SectionData } from "@/types/resume";

export function EducationSectionEditor({ section }: { section: SectionData }) {
  const addEducationEntry = useResumeStore((s) => s.addEducationEntry);
  const updateEducationEntry = useResumeStore((s) => s.updateEducationEntry);
  const updateEducationEntryDescription = useResumeStore((s) => s.updateEducationEntryDescription);
  const removeEducationEntry = useResumeStore((s) => s.removeEducationEntry);
  const moveEducationEntry = useResumeStore((s) => s.moveEducationEntry);

  const entries = section.educationEntries ?? [];

  return (
    <div className="space-y-4">
      {entries.length === 0 && (
        <InlineEmptyState
          icon={GraduationCap}
          title="No education added yet"
          hint="Add a degree, institution, and dates to get started."
        />
      )}
      {entries.map((entry, i) => (
        <div key={entry.id} className="border border-slate-200 rounded-lg p-4 bg-white">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-slate-400">Entry {i + 1}</span>
            <div className="flex items-center gap-1">
              <RowIcon onClick={() => moveEducationEntry(section.id, entry.id, "up")} disabled={i === 0}>
                <ChevronUp size={14} />
              </RowIcon>
              <RowIcon onClick={() => moveEducationEntry(section.id, entry.id, "down")} disabled={i === entries.length - 1}>
                <ChevronDown size={14} />
              </RowIcon>
              <RowIcon onClick={() => removeEducationEntry(section.id, entry.id)} danger>
                <Trash2 size={14} />
              </RowIcon>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <TextInput
              label="Degree"
              value={entry.degree}
              onChange={(e) => updateEducationEntry(section.id, entry.id, { degree: e.target.value })}
              placeholder="MCA - Blockchain"
            />
            <TextInput
              label="Field / specialization"
              value={entry.field}
              onChange={(e) => updateEducationEntry(section.id, entry.id, { field: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <TextInput
              label="Institution"
              className="col-span-2"
              value={entry.institution}
              onChange={(e) => updateEducationEntry(section.id, entry.id, { institution: e.target.value })}
              placeholder="Amity University"
            />
            <TextInput
              label="Year / date"
              value={entry.dateLabel}
              onChange={(e) => updateEducationEntry(section.id, entry.id, { dateLabel: e.target.value })}
              placeholder="Present"
            />
          </div>
          <TextInput
            label="Grade / CGPA"
            value={entry.grade}
            onChange={(e) => updateEducationEntry(section.id, entry.id, { grade: e.target.value })}
            placeholder="8.10 CGPA"
            className="mb-3"
          />
          <div>
            <span className="block text-xs font-medium text-slate-500 mb-1.5">Description (optional)</span>
            <RichTextEditor
              variant="paragraph"
              content={entry.description}
              onChange={(doc) => updateEducationEntryDescription(section.id, entry.id, doc)}
              placeholder="Relevant coursework, honors, thesis…"
            />
          </div>
        </div>
      ))}

      <Button variant="secondary" size="sm" onClick={() => addEducationEntry(section.id)}>
        <Plus size={14} /> Add education entry
      </Button>
    </div>
  );
}

function RowIcon({ children, onClick, disabled, danger }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 ${danger ? "text-red-500 hover:bg-red-50" : "text-slate-500"}`}
    >
      {children}
    </button>
  );
}
