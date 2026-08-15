import { prisma } from "@/lib/db/prisma";
import { toResumeData, RESUME_INCLUDE, type RawResume } from "@/lib/resume/serialize";
import type { ResumeData, PersonalInfo, SectionData, BulletData, EntryData, EducationEntryData } from "@/types/resume";
import { emptySection } from "@/types/resume";
import { nanoid } from "nanoid";

// NOTE: `tx` below is typed as `any` rather than `Prisma.TransactionClient`.
// The Prisma client couldn't be generated in this sandbox (see README), so
// `@prisma/client`'s generated types aren't available to import from here.
// Once `npx prisma generate` has run normally, this is safe to tighten to
// `Prisma.TransactionClient` - the runtime calls below already match the
// schema field-for-field.
type Tx = any; // eslint-disable-line @typescript-eslint/no-explicit-any

// ============================================================================
// Read
// ============================================================================
export async function getResumeData(resumeId: string, userId: string): Promise<ResumeData | null> {
  const raw = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
    include: RESUME_INCLUDE,
  });
  if (!raw) return null;
  return toResumeData(raw as unknown as RawResume);
}

// ============================================================================
// Create - seeds a light structural skeleton (Education / Experience /
// Skills), never resume CONTENT. This is scaffolding for a better empty
// state, not hardcoded personal data - every field starts blank.
// ============================================================================
export async function createResume(userId: string, title: string): Promise<ResumeData> {
  const resume = await prisma.resume.create({
    data: {
      userId,
      title: title || "Untitled Resume",
      templateId: "classic",
      personalInfo: { create: {} },
    },
  });

  const skeleton: SectionData[] = [
    emptySection(nanoid(), "EDUCATION", "Education", 0),
    emptySection(nanoid(), "ENTRIES", "Work Experience and Projects", 1),
    emptySection(nanoid(), "RICHTEXT", "Skills", 2),
  ];

  await prisma.$transaction(async (tx: Tx) => {
    for (const section of skeleton) {
      await createSectionRow(tx, resume.id, section);
    }
  });

  const data = await getResumeData(resume.id, userId);
  if (!data) throw new Error("Failed to load resume immediately after creation");
  return data;
}

// ============================================================================
// Write - full-document sync. The client sends its complete in-memory
// personalInfo + sections tree on every debounced autosave; the server
// replaces the resume's content wholesale inside one transaction.
//
// This is simpler and far more robust against drift than diffing granular
// mutations across sections/entries/bullets, and resumes are small enough
// (dozens of rows at most) that a full replace is cheap. Cascade deletes
// (see schema's onDelete: Cascade) make the "wipe sections, recreate" step
// safe and atomic.
// ============================================================================
export async function syncResumeContent(
  resumeId: string,
  userId: string,
  payload: { title?: string; templateId?: string; personalInfo: PersonalInfo; sections: SectionData[] }
): Promise<ResumeData> {
  const owned = await prisma.resume.findFirst({ where: { id: resumeId, userId }, select: { id: true } });
  if (!owned) throw new ResumeNotFoundError();

  await prisma.$transaction(async (tx: Tx) => {
    await tx.personalInfo.upsert({
      where: { resumeId },
      update: { ...payload.personalInfo },
      create: { resumeId, ...payload.personalInfo },
    });

    await tx.section.deleteMany({ where: { resumeId } });
    for (const section of payload.sections) {
      await createSectionRow(tx, resumeId, section);
    }

    await tx.resume.update({
      where: { id: resumeId },
      data: {
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.templateId !== undefined ? { templateId: payload.templateId } : {}),
      },
    });
  });

  const data = await getResumeData(resumeId, userId);
  if (!data) throw new ResumeNotFoundError();
  return data;
}

export class ResumeNotFoundError extends Error {
  constructor() {
    super("Resume not found");
    this.name = "ResumeNotFoundError";
  }
}

// ============================================================================
// Internal: create one Section row (+ its nested content) inside a transaction.
// Bullets are inserted in two passes (parents, then children) rather than as
// a single nested `create` because Bullet.parentId is a self-relation - the
// parent row must exist before a child row can reference it.
// ============================================================================
async function createSectionRow(tx: Tx, resumeId: string, section: SectionData) {
  if (section.type === "EDUCATION") {
    await tx.section.create({
      data: {
        id: section.id,
        resumeId,
        title: section.title,
        type: section.type,
        order: section.order,
        isVisible: section.isVisible,
        educationEntries: {
          create: (section.educationEntries ?? []).map((e) => ({
            id: e.id,
            order: e.order,
            degree: e.degree,
            field: e.field,
            institution: e.institution,
            dateLabel: e.dateLabel,
            grade: e.grade,
            description: e.description ?? undefined,
          })),
        },
      },
    });
    return;
  }

  if (section.type === "ENTRIES") {
    await tx.section.create({
      data: {
        id: section.id,
        resumeId,
        title: section.title,
        type: section.type,
        order: section.order,
        isVisible: section.isVisible,
        entries: {
          create: (section.entries ?? []).map((en) => ({
            id: en.id,
            order: en.order,
            title: en.title,
            subtitle: en.subtitle,
            location: en.location,
            startDate: en.startDate,
            endDate: en.endDate,
            isCurrent: en.isCurrent,
            dateLabel: en.dateLabel,
            description: en.description ?? undefined,
          })),
        },
      },
    });

    for (const entry of section.entries ?? []) {
      await createBulletsForEntry(tx, entry.id, entry.bullets);
    }
    return;
  }

  // RICHTEXT
  await tx.section.create({
    data: {
      id: section.id,
      resumeId,
      title: section.title,
      type: section.type,
      order: section.order,
      isVisible: section.isVisible,
      richContent: section.richContent ?? undefined,
    },
  });
}

async function createBulletsForEntry(tx: Tx, entryId: string, bullets: BulletData[]) {
  // Pass 1: top-level bullets
  for (const b of bullets) {
    await tx.bullet.create({
      data: { id: b.id, entryId, parentId: null, order: b.order, content: b.content },
    });
  }
  // Pass 2: their children (one level of nesting, matching the data model)
  for (const b of bullets) {
    for (const child of b.children) {
      await tx.bullet.create({
        data: { id: child.id, entryId, parentId: b.id, order: child.order, content: child.content },
      });
    }
  }
}

// ============================================================================
// Duplicate - deep-clones a resume's personalInfo + full section/entry/
// bullet tree under a brand-new Resume row, generating fresh ids throughout
// so the copy shares nothing with the original at the database level.
// ============================================================================
export async function duplicateResume(resumeId: string, userId: string): Promise<ResumeData> {
  const source = await getResumeData(resumeId, userId);
  if (!source) throw new ResumeNotFoundError();

  const created = await prisma.resume.create({
    data: {
      userId,
      title: `${source.title} (Copy)`,
      templateId: source.templateId,
      personalInfo: { create: { ...source.personalInfo, extraLinks: source.personalInfo.extraLinks as any } },
    },
  });

  const clonedSections = source.sections.map(cloneSectionWithNewIds);
  await prisma.$transaction(async (tx: Tx) => {
    for (const section of clonedSections) {
      await createSectionRow(tx, created.id, section);
    }
  });

  const data = await getResumeData(created.id, userId);
  if (!data) throw new Error("Failed to load resume immediately after duplication");
  return data;
}

function cloneBulletWithNewIds(bullet: BulletData): BulletData {
  return { id: nanoid(), order: bullet.order, content: bullet.content, children: bullet.children.map(cloneBulletWithNewIds) };
}
function cloneEntryWithNewIds(entry: EntryData): EntryData {
  return { ...entry, id: nanoid(), bullets: entry.bullets.map(cloneBulletWithNewIds) };
}
function cloneEducationEntryWithNewIds(entry: EducationEntryData): EducationEntryData {
  return { ...entry, id: nanoid() };
}
function cloneSectionWithNewIds(section: SectionData): SectionData {
  const base = { ...section, id: nanoid() };
  if (section.type === "EDUCATION") {
    return { ...base, educationEntries: (section.educationEntries ?? []).map(cloneEducationEntryWithNewIds) };
  }
  if (section.type === "ENTRIES") {
    return { ...base, entries: (section.entries ?? []).map(cloneEntryWithNewIds) };
  }
  return base; // RICHTEXT - richContent carries over as-is (immutable JSON data, never mutated in place)
}

// ============================================================================
// Delete
// ============================================================================
export async function deleteResume(resumeId: string, userId: string): Promise<boolean> {
  const result = await prisma.resume.deleteMany({ where: { id: resumeId, userId } });
  return result.count > 0;
}

// ============================================================================
// List - light projection for the dashboard (Checkpoint 6)
// ============================================================================
export async function listResumes(userId: string) {
  return prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, templateId: true, updatedAt: true, createdAt: true },
  });
}
