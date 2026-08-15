import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { createResume, listResumes } from "@/lib/resume/sync";
import { createResumePayload } from "@/lib/resume/validation";

export async function GET() {
  const userId = await getCurrentUserId();
  const resumes = await listResumes(userId);
  return NextResponse.json({ resumes });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine - title falls back to a default
  }

  const parsed = createResumePayload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
  }

  const resume = await createResume(userId, parsed.data.title ?? "Untitled Resume");
  return NextResponse.json({ resume }, { status: 201 });
}
