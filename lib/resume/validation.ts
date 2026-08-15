import { z } from "zod";

// ============================================================================
// Validation for the autosave payload (PUT /api/resumes/[id]).
// ----------------------------------------------------------------------------
// Rich text fields (`content`, `description`, `richContent`) are validated
// only as "present or absent", not deeply - they're opaque Tiptap JSON as far
// as the API is concerned, and Tiptap itself is the source of truth for
// well-formed docs once Checkpoint 3 wires it in. Deep-validating a
// ProseMirror doc schema here would be a lot of code for little benefit: a
// malformed doc renders as blank/odd, it can't corrupt other data or crash
// the server.
// ============================================================================

const richTextDoc = z.record(z.string(), z.unknown()).nullable().optional();

const extraLink = z.object({ label: z.string(), url: z.string() });

const personalInfo = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  linkedin: z.string(),
  website: z.string(),
  extraLinks: z.array(extraLink),
});

const bulletBase = z.object({
  id: z.string().min(1),
  order: z.number(),
  content: richTextDoc,
});
type BulletInput = z.infer<typeof bulletBase> & { children: BulletInput[] };
const bullet: z.ZodType<BulletInput> = bulletBase.extend({
  children: z.lazy(() => z.array(bullet)),
});

const educationEntry = z.object({
  id: z.string().min(1),
  order: z.number(),
  degree: z.string(),
  field: z.string(),
  institution: z.string(),
  dateLabel: z.string(),
  grade: z.string(),
  description: richTextDoc,
});

const entry = z.object({
  id: z.string().min(1),
  order: z.number(),
  title: z.string(),
  subtitle: z.string(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  isCurrent: z.boolean(),
  dateLabel: z.string(),
  description: richTextDoc,
  bullets: z.array(bullet),
});

const section = z.object({
  id: z.string().min(1),
  order: z.number(),
  title: z.string(),
  type: z.enum(["EDUCATION", "ENTRIES", "RICHTEXT"]),
  isVisible: z.boolean(),
  educationEntries: z.array(educationEntry).optional(),
  entries: z.array(entry).optional(),
  richContent: richTextDoc,
});

export const resumeSyncPayload = z.object({
  title: z.string().optional(),
  templateId: z.string().optional(),
  personalInfo,
  sections: z.array(section),
});

export const resumeMetadataPayload = z.object({
  title: z.string().min(1).max(200).optional(),
  templateId: z.string().optional(),
});

export const createResumePayload = z.object({
  title: z.string().max(200).optional(),
});
