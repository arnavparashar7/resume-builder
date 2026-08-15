import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { duplicateResume, ResumeNotFoundError } from "@/lib/resume/sync";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  try {
    const resume = await duplicateResume(id, userId);
    return NextResponse.json({ resume }, { status: 201 });
  } catch (err) {
    if (err instanceof ResumeNotFoundError) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }
    console.error("Failed to duplicate resume:", err);
    return NextResponse.json({ error: "Failed to duplicate resume" }, { status: 500 });
  }
}
