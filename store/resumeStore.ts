import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import type {
  ResumeData,
  PersonalInfo,
  SectionData,
  SectionType,
  EducationEntryData,
  EntryData,
  BulletData,
  ExtraLink,
  RichTextDoc,
} from "@/types/resume";
import { emptySection, emptyEducationEntry, emptyEntry, emptyBullet } from "@/types/resume";
import { moveAndReorder, reassignOrder } from "@/lib/resume/reorder";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface ResumeStoreState {
  resume: ResumeData;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  saveError: string | null;

  // ---- meta ----
  setTitle: (title: string) => void;
  setTemplateId: (templateId: string) => void;

  // ---- personal info ----
  setPersonalInfo: (patch: Partial<PersonalInfo>) => void;
  addExtraLink: () => void;
  updateExtraLink: (index: number, patch: Partial<ExtraLink>) => void;
  removeExtraLink: (index: number) => void;

  // ---- sections ----
  addSection: (type: SectionType, title: string) => string;
  removeSection: (sectionId: string) => void;
  renameSection: (sectionId: string, title: string) => void;
  toggleSectionVisibility: (sectionId: string) => void;
  moveSection: (sectionId: string, direction: "up" | "down") => void;
  setRichContent: (sectionId: string, doc: RichTextDoc) => void;

  // ---- education entries ----
  addEducationEntry: (sectionId: string) => void;
  updateEducationEntry: (sectionId: string, entryId: string, patch: Partial<EducationEntryData>) => void;
  updateEducationEntryDescription: (sectionId: string, entryId: string, doc: RichTextDoc) => void;
  removeEducationEntry: (sectionId: string, entryId: string) => void;
  moveEducationEntry: (sectionId: string, entryId: string, direction: "up" | "down") => void;

  // ---- entries (experience-shaped) ----
  addEntry: (sectionId: string) => void;
  updateEntry: (sectionId: string, entryId: string, patch: Partial<EntryData>) => void;
  updateEntryDescription: (sectionId: string, entryId: string, doc: RichTextDoc) => void;
  removeEntry: (sectionId: string, entryId: string) => void;
  moveEntry: (sectionId: string, entryId: string, direction: "up" | "down") => void;

  // ---- bullets (one level of nesting) ----
  addBullet: (sectionId: string, entryId: string, parentBulletId?: string) => void;
  updateBulletContent: (sectionId: string, entryId: string, bulletId: string, doc: RichTextDoc) => void;
  removeBullet: (sectionId: string, entryId: string, bulletId: string) => void;
  moveBullet: (sectionId: string, entryId: string, bulletId: string, direction: "up" | "down") => void;

  // ---- save lifecycle (driven by the autosave hook, see hooks/useAutosave.ts) ----
  markSaving: () => void;
  markSaved: (updatedAt: string) => void;
  markSaveError: (message: string) => void;
  replaceResume: (data: ResumeData) => void;
}

function findSection(resume: ResumeData, sectionId: string): SectionData | undefined {
  return resume.sections.find((s) => s.id === sectionId);
}

function findEntry(section: SectionData, entryId: string): EntryData | undefined {
  return section.entries?.find((e) => e.id === entryId);
}

/** Returns the array (entry.bullets, or some bullet's .children) that directly contains bulletId. */
function findBulletContainer(entry: EntryData, bulletId: string): BulletData[] | null {
  if (entry.bullets.some((b) => b.id === bulletId)) return entry.bullets;
  for (const b of entry.bullets) {
    if (b.children.some((c) => c.id === bulletId)) return b.children;
  }
  return null;
}

export function createResumeStore(initial: ResumeData) {
  return createStore<ResumeStoreState>()(
    immer((set) => ({
      resume: initial,
      saveStatus: "idle",
      lastSavedAt: initial.updatedAt,
      saveError: null,

      setTitle: (title) =>
        set((s) => {
          s.resume.title = title;
        }),
      setTemplateId: (templateId) =>
        set((s) => {
          s.resume.templateId = templateId;
        }),

      setPersonalInfo: (patch) =>
        set((s) => {
          Object.assign(s.resume.personalInfo, patch);
        }),
      addExtraLink: () =>
        set((s) => {
          s.resume.personalInfo.extraLinks.push({ label: "", url: "" });
        }),
      updateExtraLink: (index, patch) =>
        set((s) => {
          const link = s.resume.personalInfo.extraLinks[index];
          if (link) Object.assign(link, patch);
        }),
      removeExtraLink: (index) =>
        set((s) => {
          s.resume.personalInfo.extraLinks.splice(index, 1);
        }),

      addSection: (type, title) => {
        const id = nanoid();
        set((s) => {
          s.resume.sections.push(emptySection(id, type, title, s.resume.sections.length));
        });
        return id;
      },
      removeSection: (sectionId) =>
        set((s) => {
          s.resume.sections = s.resume.sections.filter((sec) => sec.id !== sectionId);
          reassignOrder(s.resume.sections);
        }),
      renameSection: (sectionId, title) =>
        set((s) => {
          const section = findSection(s.resume, sectionId);
          if (section) section.title = title;
        }),
      toggleSectionVisibility: (sectionId) =>
        set((s) => {
          const section = findSection(s.resume, sectionId);
          if (section) section.isVisible = !section.isVisible;
        }),
      moveSection: (sectionId, direction) =>
        set((s) => {
          moveAndReorder(s.resume.sections, sectionId, direction);
        }),
      setRichContent: (sectionId, doc) =>
        set((s) => {
          const section = findSection(s.resume, sectionId);
          if (section) section.richContent = doc;
        }),

      addEducationEntry: (sectionId) =>
        set((s) => {
          const section = findSection(s.resume, sectionId);
          if (section?.educationEntries) {
            section.educationEntries.push(emptyEducationEntry(nanoid(), section.educationEntries.length));
          }
        }),
      updateEducationEntry: (sectionId, entryId, patch) =>
        set((s) => {
          const section = findSection(s.resume, sectionId);
          const entry = section?.educationEntries?.find((e) => e.id === entryId);
          if (entry) Object.assign(entry, patch);
        }),
      updateEducationEntryDescription: (sectionId, entryId, doc) =>
        set((s) => {
          const section = findSection(s.resume, sectionId);
          const entry = section?.educationEntries?.find((e) => e.id === entryId);
          if (entry) entry.description = doc;
        }),
      removeEducationEntry: (sectionId, entryId) =>
        set((s) => {
          const section = findSection(s.resume, sectionId);
          if (section?.educationEntries) {
            section.educationEntries = section.educationEntries.filter((e) => e.id !== entryId);
            reassignOrder(section.educationEntries);
          }
        }),
      moveEducationEntry: (sectionId, entryId, direction) =>
        set((s) => {
          const section = findSection(s.resume, sectionId);
          if (section?.educationEntries) moveAndReorder(section.educationEntries, entryId, direction);
        }),

      addEntry: (sectionId) =>
        set((s) => {
          const section = findSection(s.resume, sectionId);
          if (section?.entries) {
            section.entries.push(emptyEntry(nanoid(), section.entries.length));
          }
        }),
      updateEntry: (sectionId, entryId, patch) =>
        set((s) => {
          const section = findSection(s.resume, sectionId);
          const entry = section && findEntry(section, entryId);
          if (entry) Object.assign(entry, patch);
        }),
      updateEntryDescription: (sectionId, entryId, doc) =>
        set((s) => {
          const section = findSection(s.resume, sectionId);
          const entry = section && findEntry(section, entryId);
          if (entry) entry.description = doc;
        }),
      removeEntry: (sectionId, entryId) =>
        set((s) => {
          const section = findSection(s.resume, sectionId);
          if (section?.entries) {
            section.entries = section.entries.filter((e) => e.id !== entryId);
            reassignOrder(section.entries);
          }
        }),
      moveEntry: (sectionId, entryId, direction) =>
        set((s) => {
          const section = findSection(s.resume, sectionId);
          if (section?.entries) moveAndReorder(section.entries, entryId, direction);
        }),

      addBullet: (sectionId, entryId, parentBulletId) =>
        set((s) => {
          const section = findSection(s.resume, sectionId);
          const entry = section && findEntry(section, entryId);
          if (!entry) return;
          if (!parentBulletId) {
            entry.bullets.push(emptyBullet(nanoid(), entry.bullets.length));
            return;
          }
          const parent = entry.bullets.find((b) => b.id === parentBulletId);
          if (parent) parent.children.push(emptyBullet(nanoid(), parent.children.length));
        }),
      updateBulletContent: (sectionId, entryId, bulletId, doc) =>
        set((s) => {
          const section = findSection(s.resume, sectionId);
          const entry = section && findEntry(section, entryId);
          if (!entry) return;
          const container = findBulletContainer(entry, bulletId);
          const bullet = container?.find((b) => b.id === bulletId);
          if (bullet) bullet.content = doc;
        }),
      removeBullet: (sectionId, entryId, bulletId) =>
        set((s) => {
          const section = findSection(s.resume, sectionId);
          const entry = section && findEntry(section, entryId);
          if (!entry) return;
          const container = findBulletContainer(entry, bulletId);
          if (container) {
            const idx = container.findIndex((b) => b.id === bulletId);
            if (idx !== -1) {
              container.splice(idx, 1);
              reassignOrder(container);
            }
          }
        }),
      moveBullet: (sectionId, entryId, bulletId, direction) =>
        set((s) => {
          const section = findSection(s.resume, sectionId);
          const entry = section && findEntry(section, entryId);
          if (!entry) return;
          const container = findBulletContainer(entry, bulletId);
          if (container) moveAndReorder(container, bulletId, direction);
        }),

      markSaving: () =>
        set((s) => {
          s.saveStatus = "saving";
          s.saveError = null;
        }),
      markSaved: (updatedAt) =>
        set((s) => {
          s.saveStatus = "saved";
          s.lastSavedAt = updatedAt;
          s.resume.updatedAt = updatedAt;
        }),
      markSaveError: (message) =>
        set((s) => {
          s.saveStatus = "error";
          s.saveError = message;
        }),
      replaceResume: (data) =>
        set((s) => {
          s.resume = data;
          s.lastSavedAt = data.updatedAt;
          s.saveStatus = "idle";
          s.saveError = null;
        }),
    }))
  );
}

export type ResumeStore = ReturnType<typeof createResumeStore>;
