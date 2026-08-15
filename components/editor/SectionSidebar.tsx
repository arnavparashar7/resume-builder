"use client";

import { useState } from "react";
import { useResumeStore } from "@/store/ResumeStoreProvider";
import { Button } from "@/components/ui/Button";
import type { SectionType } from "@/types/resume";
import { ChevronUp, ChevronDown, Eye, EyeOff, Trash2, Plus, User } from "lucide-react";
import clsx from "clsx";

const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  EDUCATION: "Education table",
  ENTRIES: "Experience-style entries",
  RICHTEXT: "Free text block",
};

export function SectionSidebar({
  activeId,
  onSelect,
}: {
  activeId: string; // "personal-info" or a section id
  onSelect: (id: string) => void;
}) {
  const sections = useResumeStore((s) => s.resume.sections);
  const addSection = useResumeStore((s) => s.addSection);
  const removeSection = useResumeStore((s) => s.removeSection);
  const renameSection = useResumeStore((s) => s.renameSection);
  const toggleVisibility = useResumeStore((s) => s.toggleSectionVisibility);
  const moveSection = useResumeStore((s) => s.moveSection);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [addPickerOpen, setAddPickerOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 overflow-y-auto py-2">
        <button
          onClick={() => onSelect("personal-info")}
          className={clsx(
            "w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md mx-2 mb-1 transition-colors",
            activeId === "personal-info" ? "bg-slate-900 dark:bg-slate-800 text-white" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <User size={14} />
          Personal Info
        </button>

        <div className="mx-2 mt-3 mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 px-1">
          Sections
        </div>

        {sections.length === 0 && (
          <p className="mx-3 my-2 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
            No sections yet. Use <span className="font-medium text-slate-500 dark:text-slate-400">+ Add Section</span> below to add
            Education, Experience, or a free-text block like Skills.
          </p>
        )}

        {sections.map((section, i) => (
          <div
            key={section.id}
            className={clsx(
              "group mx-2 mb-1 rounded-md transition-colors",
              activeId === section.id ? "bg-slate-900 dark:bg-slate-800 text-white" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            {renamingId === section.id ? (
              <input
                autoFocus
                defaultValue={section.title}
                className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm rounded-md px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-500"
                onBlur={(e) => {
                  renameSection(section.id, e.target.value || section.title);
                  setRenamingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") setRenamingId(null);
                }}
              />
            ) : (
              <button
                onClick={() => onSelect(section.id)}
                onDoubleClick={() => setRenamingId(section.id)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left"
                title="Double-click to rename"
              >
                <span className={clsx("truncate", !section.isVisible && "italic opacity-60")}>{section.title}</span>
              </button>
            )}

            <div
              className={clsx(
                "flex items-center gap-0.5 px-2 pb-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity",
                activeId === section.id && "opacity-100"
              )}
            >
              <IconAction onClick={() => moveSection(section.id, "up")} disabled={i === 0} label="Move up" active={activeId === section.id}>
                <ChevronUp size={13} />
              </IconAction>
              <IconAction onClick={() => moveSection(section.id, "down")} disabled={i === sections.length - 1} label="Move down" active={activeId === section.id}>
                <ChevronDown size={13} />
              </IconAction>
              <IconAction onClick={() => toggleVisibility(section.id)} label={section.isVisible ? "Hide from resume" : "Show on resume"} active={activeId === section.id}>
                {section.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
              </IconAction>
              <IconAction
                onClick={() => {
                  if (confirm(`Delete "${section.title}"? This can't be undone.`)) {
                    removeSection(section.id);
                    if (activeId === section.id) onSelect("personal-info");
                  }
                }}
                label="Delete section"
                active={activeId === section.id}
              >
                <Trash2 size={13} />
              </IconAction>
            </div>
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-slate-200 dark:border-slate-800 relative">
        <Button variant="secondary" size="sm" className="w-full justify-center" onClick={() => setAddPickerOpen((v) => !v)}>
          <Plus size={14} /> Add Section
        </Button>
        {addPickerOpen && (
          <div className="absolute bottom-full left-2 right-2 mb-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg p-1.5 space-y-0.5 z-10">
            {(Object.keys(SECTION_TYPE_LABELS) as SectionType[]).map((type) => (
              <button
                key={type}
                className="w-full text-left text-sm px-2.5 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() => {
                  const title = prompt("Section name", type === "EDUCATION" ? "Education" : type === "ENTRIES" ? "New Section" : "Skills");
                  if (title) {
                    const id = addSection(type, title);
                    onSelect(id);
                  }
                  setAddPickerOpen(false);
                }}
              >
                <div className="font-medium text-slate-800 dark:text-slate-200">{type === "EDUCATION" ? "Education" : type === "ENTRIES" ? "Experience / Projects style" : "Free text"}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">{SECTION_TYPE_LABELS[type]}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IconAction({
  children,
  onClick,
  disabled,
  label,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={clsx(
        "p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors",
        active ? "hover:bg-white/20" : "hover:bg-slate-200 dark:hover:bg-slate-700"
      )}
    >
      {children}
    </button>
  );
}
