import type { EntryData, EducationEntryData, SectionData } from "@/types/resume";

/**
 * The date string a template should display for an entry. `dateLabel` (a
 * freeform field like "Jan'24-Present") always wins if set, since that's
 * what the editor UI collects today. Falls back to formatting
 * startDate/endDate/isCurrent for forward-compatibility if a future editor
 * revision adds real date pickers.
 */
export function displayDateRange(entry: Pick<EntryData, "dateLabel" | "startDate" | "endDate" | "isCurrent">): string {
  if (entry.dateLabel.trim()) return entry.dateLabel.trim();
  const start = formatMonthYear(entry.startDate);
  const end = entry.isCurrent ? "Present" : formatMonthYear(entry.endDate);
  if (!start && !end) return "";
  if (start && end) return `${start} - ${end}`;
  return start || end;
}

export function displayEducationDate(entry: Pick<EducationEntryData, "dateLabel">): string {
  return entry.dateLabel.trim();
}

function formatMonthYear(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso; // already a plain label, pass through
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

/** Sections a template should actually draw - hidden sections never render. */
export function visibleSections(sections: SectionData[]): SectionData[] {
  return sections.filter((s) => s.isVisible);
}
