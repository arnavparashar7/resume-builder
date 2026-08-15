"use client";

import { useResumeStore } from "@/store/ResumeStoreProvider";
import { TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { BulletListEditor } from "@/components/editor/BulletListEditor";
import { RichTextEditor } from "@/components/editor/rich-text/RichTextEditor";
import { InlineEmptyState } from "@/components/ui/InlineEmptyState";
import { ChevronUp, ChevronDown, Trash2, Plus, ListPlus } from "lucide-react";
import type { SectionData } from "@/types/resume";

export function EntriesSectionEditor({ section }: { section: SectionData }) {
  const addEntry = useResumeStore((s) => s.addEntry);
  const updateEntry = useResumeStore((s) => s.updateEntry);
  const updateEntryDescription = useResumeStore((s) => s.updateEntryDescription);
  const removeEntry = useResumeStore((s) => s.removeEntry);
  const moveEntry = useResumeStore((s) => s.moveEntry);

  const entries = section.entries ?? [];

  return (
    <div className="space-y-4">
      {entries.length === 0 && (
        <InlineEmptyState
          icon={ListPlus}
          title="Nothing here yet"
          hint="Add an entry with a title, dates, and bullet points describing it."
        />
      )}
      {entries.map((entry, i) => (
        <div key={entry.id} className="border border-slate-200 rounded-lg p-4 bg-white">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-slate-400">Entry {i + 1}</span>
            <div className="flex items-center gap-1">
              <RowIcon onClick={() => moveEntry(section.id, entry.id, "up")} disabled={i === 0}>
                <ChevronUp size={14} />
              </RowIcon>
              <RowIcon onClick={() => moveEntry(section.id, entry.id, "down")} disabled={i === entries.length - 1}>
                <ChevronDown size={14} />
              </RowIcon>
              <RowIcon onClick={() => removeEntry(section.id, entry.id)} danger>
                <Trash2 size={14} />
              </RowIcon>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <TextInput
              label="Title"
              value={entry.title}
              onChange={(e) => updateEntry(section.id, entry.id, { title: e.target.value })}
              placeholder="Live Project: Project Minties"
            />
            <TextInput
              label="Company / organization / role qualifier"
              value={entry.subtitle}
              onChange={(e) => updateEntry(section.id, entry.id, { subtitle: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <TextInput
              label="Location"
              value={entry.location}
              onChange={(e) => updateEntry(section.id, entry.id, { location: e.target.value })}
              placeholder="Optional"
            />
            <TextInput
              label="Date label"
              value={entry.dateLabel}
              onChange={(e) => updateEntry(section.id, entry.id, { dateLabel: e.target.value })}
              placeholder="(Jan'24-Present)"
            />
            <label className="flex items-center gap-2 mt-5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={entry.isCurrent}
                onChange={(e) => updateEntry(section.id, entry.id, { isCurrent: e.target.checked })}
              />
              Current
            </label>
          </div>

          <div className="mb-3">
            <span className="block text-xs font-medium text-slate-500 mb-1.5">Description (optional intro, above the bullets)</span>
            <RichTextEditor
              variant="paragraph"
              content={entry.description}
              onChange={(doc) => updateEntryDescription(section.id, entry.id, doc)}
              placeholder="Briefly introduce this role or project…"
            />
          </div>

          <div className="mb-1">
            <span className="block text-xs font-medium text-slate-500 mb-1.5">Bullets</span>
            <BulletListEditor sectionId={section.id} entryId={entry.id} bullets={entry.bullets} />
          </div>
        </div>
      ))}

      <Button variant="secondary" size="sm" onClick={() => addEntry(section.id)}>
        <Plus size={14} /> Add entry
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
