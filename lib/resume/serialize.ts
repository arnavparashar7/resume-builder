import type {
  ResumeData,
  SectionData,
  SectionType,
  EducationEntryData,
  EntryData,
  BulletData,
  PersonalInfo,
  RichTextDoc,
} from "@/types/resume";
import { emptyPersonalInfo } from "@/types/resume";

// ============================================================================
// Prisma row -> ResumeData
// ----------------------------------------------------------------------------
// These input types describe the shape produced by RESUME_INCLUDE (below),
// written by hand rather than imported from `@prisma/client` because the
// Prisma client can't be generated in this build environment (see README).
// They match prisma/schema.prisma field-for-field; once `prisma generate`
// runs normally these are structurally identical to the generated payload
// type, so nothing here needs to change.
// ============================================================================

export const RESUME_INCLUDE = {
  personalInfo: true,
  sections: {
    orderBy: { order: "asc" as const },
    include: {
      educationEntries: { orderBy: { order: "asc" as const } },
      entries: {
        orderBy: { order: "asc" as const },
        include: { bullets: { orderBy: { order: "asc" as const } } },
      },
    },
  },
};

interface RawBullet {
  id: string;
  order: number;
  parentId: string | null;
  content: unknown;
}
interface RawEntry {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  dateLabel: string;
  description: unknown;
  bullets: RawBullet[];
}
interface RawEducationEntry {
  id: string;
  order: number;
  degree: string;
  field: string;
  institution: string;
  dateLabel: string;
  grade: string;
  description: unknown;
}
interface RawSection {
  id: string;
  order: number;
  title: string;
  type: string;
  isVisible: boolean;
  richContent: unknown;
  educationEntries: RawEducationEntry[];
  entries: RawEntry[];
}
interface RawPersonalInfo {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  website: string;
  extraLinks: unknown;
}
export interface RawResume {
  id: string;
  title: string;
  templateId: string;
  updatedAt: Date;
  personalInfo: RawPersonalInfo | null;
  sections: RawSection[];
}

function asDoc(value: unknown): RichTextDoc | null {
  return (value as RichTextDoc | null) ?? null;
}

function buildBulletTree(flat: RawBullet[]): BulletData[] {
  const byParent = new Map<string | null, RawBullet[]>();
  for (const b of flat) {
    const key = b.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(b);
  }
  const toNode = (b: RawBullet): BulletData => ({
    id: b.id,
    order: b.order,
    content: asDoc(b.content) ?? { type: "doc", content: [{ type: "paragraph" }] },
    // Only one level of nesting is exposed by the editor; grandchildren (if
    // any ever exist in the DB) are intentionally not recursed into here.
    children: (byParent.get(b.id) ?? [])
      .sort((a, c) => a.order - c.order)
      .map((child) => ({ ...toNode(child), children: [] })),
  });
  return (byParent.get(null) ?? []).sort((a, b) => a.order - b.order).map(toNode);
}

function mapEducationEntry(e: RawEducationEntry): EducationEntryData {
  return {
    id: e.id,
    order: e.order,
    degree: e.degree,
    field: e.field,
    institution: e.institution,
    dateLabel: e.dateLabel,
    grade: e.grade,
    description: asDoc(e.description),
  };
}

function mapEntry(e: RawEntry): EntryData {
  return {
    id: e.id,
    order: e.order,
    title: e.title,
    subtitle: e.subtitle,
    location: e.location,
    startDate: e.startDate,
    endDate: e.endDate,
    isCurrent: e.isCurrent,
    dateLabel: e.dateLabel,
    description: asDoc(e.description),
    bullets: buildBulletTree(e.bullets),
  };
}

function mapSection(s: RawSection): SectionData {
  const type = s.type as SectionType;
  const base = { id: s.id, order: s.order, title: s.title, type, isVisible: s.isVisible };
  if (type === "EDUCATION") {
    return { ...base, educationEntries: s.educationEntries.sort((a, b) => a.order - b.order).map(mapEducationEntry) };
  }
  if (type === "ENTRIES") {
    return { ...base, entries: s.entries.sort((a, b) => a.order - b.order).map(mapEntry) };
  }
  return { ...base, richContent: asDoc(s.richContent) };
}

function mapPersonalInfo(p: RawPersonalInfo | null): PersonalInfo {
  if (!p) return emptyPersonalInfo();
  return {
    name: p.name,
    email: p.email,
    phone: p.phone,
    linkedin: p.linkedin,
    website: p.website,
    extraLinks: (p.extraLinks as PersonalInfo["extraLinks"]) ?? [],
  };
}

export function toResumeData(raw: RawResume): ResumeData {
  return {
    id: raw.id,
    title: raw.title,
    templateId: raw.templateId,
    personalInfo: mapPersonalInfo(raw.personalInfo),
    sections: raw.sections.sort((a, b) => a.order - b.order).map(mapSection),
    updatedAt: raw.updatedAt.toISOString(),
  };
}
