import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getResumeData, syncResumeContent, deleteResume, ResumeNotFoundError } from "@/lib/resume/sync";
import { resumeSyncPayload, resumeMetadataPayload } from "@/lib/resume/validation";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const resume = await getResumeData(id, userId);
  if (!resume) return NextResponse.json({ error: "Resume not found" }, { status: 404 });

  return NextResponse.json({ resume });
}

/**
 * Full-document autosave. The editor sends its entire current
 * personalInfo + sections tree; see lib/resume/sync.ts for why this is a
 * wholesale replace rather than granular per-field updates.
 */
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const parsed = resumeSyncPayload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid resume payload", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const resume = await syncResumeContent(id, userId, parsed.data as never);
    return NextResponse.json({ resume });
  } catch (err) {
    if (err instanceof ResumeNotFoundError) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }
    console.error("Failed to sync resume", err);
    return NextResponse.json({ error: "Failed to save resume" }, { status: 500 });
  }
}

/** Lightweight metadata-only update - resume title (dashboard rename) and/or template selection. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const parsed = resumeMetadataPayload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
  }

  const owned = await prisma.resume.findFirst({ where: { id, userId }, select: { id: true } });
  if (!owned) return NextResponse.json({ error: "Resume not found" }, { status: 404 });

  const updated = await prisma.resume.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ resume: { id: updated.id, title: updated.title, templateId: updated.templateId, updatedAt: updated.updatedAt } });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const deleted = await deleteResume(id, userId);
  if (!deleted) return NextResponse.json({ error: "Resume not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
