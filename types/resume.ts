// ============================================================================
// Resume data types
// ----------------------------------------------------------------------------
// This file is the single source of truth for "what a resume's CONTENT looks
// like". Nothing in here knows about fonts, colors, page size, or layout -
// that is entirely the template's job (see templates/types.ts).
//
// A template component's only input is a `ResumeData` object. If you can
// build one of these, you can render it in ANY template, including ones that
// don't exist yet.
// ============================================================================

/** A Tiptap / ProseMirror document. Stored structurally, never as raw HTML. */
export interface RichTextDoc {
  type: "doc";
  content?: RichTextNode[];
}

export interface RichTextNode {
  type: string; // "paragraph" | "text" | "bulletList" | "listItem" | ...
  attrs?: Record<string, unknown>;
  marks?: RichTextMark[];
  content?: RichTextNode[];
  text?: string;
}

export interface RichTextMark {
  type: string; // "bold" | "italic" | "underline" | "strike" | "link" | "textStyle" | "highlight"
  attrs?: Record<string, unknown>;
}

/** An empty-but-valid rich text document, used as a default value. */
export const EMPTY_RICH_TEXT: RichTextDoc = { type: "doc", content: [{ type: "paragraph" }] };

// ----------------------------------------------------------------------------
// Personal info
// ----------------------------------------------------------------------------
export interface ExtraLink {
  label: string;
  url: string;
}

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  website: string;
  extraLinks: ExtraLink[];
}

// ----------------------------------------------------------------------------
// Section types
// ----------------------------------------------------------------------------

/**
 * The three "shapes" a section's content can take. This is deliberately a
 * small, closed set - flexibility comes from users creating as many sections
 * of these types as they want (and naming/ordering them freely), not from an
 * open-ended schema. See prisma/schema.prisma for the rationale.
 */
export type SectionType = "EDUCATION" | "ENTRIES" | "RICHTEXT";

export interface EducationEntryData {
  id: string;
  order: number;
  degree: string;
  field: string;
  institution: string;
  dateLabel: string;
  grade: string;
  description?: RichTextDoc | null;
}

export interface BulletData {
  id: string;
  order: number;
  content: RichTextDoc;
  children: BulletData[]; // one level of nesting is rendered; the type allows recursion
}

export interface EntryData {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  dateLabel: string; // if set, wins over startDate/endDate for display
  description?: RichTextDoc | null;
  bullets: BulletData[];
}

export interface SectionData {
  id: string;
  order: number;
  title: string;
  type: SectionType;
  isVisible: boolean;
  // Exactly one of these is populated, matching `type`:
  educationEntries?: EducationEntryData[];
  entries?: EntryData[];
  richContent?: RichTextDoc | null;
}

// ----------------------------------------------------------------------------
// Top-level resume
// ----------------------------------------------------------------------------
export interface ResumeData {
  id: string;
  title: string;
  templateId: string;
  personalInfo: PersonalInfo;
  sections: SectionData[];
  updatedAt: string; // ISO timestamp, used for "Saved at ..." UI
}

// ----------------------------------------------------------------------------
// Helpers for creating fresh, empty content (used by "Add Section" / "Add
// Entry" flows). Centralized here so the editor and any seed/test code agree
// on defaults.
// ----------------------------------------------------------------------------
export function emptyPersonalInfo(): PersonalInfo {
  return { name: "", email: "", phone: "", linkedin: "", website: "", extraLinks: [] };
}

export function emptyBullet(id: string, order = 0): BulletData {
  return { id, order, content: structuredClone(EMPTY_RICH_TEXT), children: [] };
}

export function emptyEntry(id: string, order = 0): EntryData {
  return {
    id,
    order,
    title: "",
    subtitle: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    dateLabel: "",
    description: null,
    bullets: [],
  };
}

export function emptyEducationEntry(id: string, order = 0): EducationEntryData {
  return { id, order, degree: "", field: "", institution: "", dateLabel: "", grade: "", description: null };
}

export function emptySection(id: string, type: SectionType, title: string, order = 0): SectionData {
  const base = { id, order, title, type, isVisible: true };
  if (type === "EDUCATION") return { ...base, educationEntries: [] };
  if (type === "ENTRIES") return { ...base, entries: [] };
  return { ...base, richContent: structuredClone(EMPTY_RICH_TEXT) };
}
