import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { generateResumePdf } from "@/lib/pdf/generateResumePdf";
import crypto from "crypto";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const resume = await prisma.resume.findFirst({ where: { id, userId }, select: { id: true, title: true } });
  if (!resume) return NextResponse.json({ error: "Resume not found" }, { status: 404 });

  // Same-origin URL to this app's own /print/[id] route - see
  // lib/pdf/generateResumePdf.ts for why PDF generation is "screenshot our
  // own preview route" rather than a separate rendering path.
  // We append a secure token so that the server-side print page can authenticate
  // the PDF engine request.
  const token = crypto
    .createHmac("sha256", process.env.AUTH_SECRET || "")
    .update(id)
    .digest("hex");
  const printUrl = new URL(`/print/${id}?token=${token}`, req.nextUrl.origin).toString();

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateResumePdf(printUrl);
  } catch (err) {
    console.error("PDF generation failed:", err);
    return NextResponse.json(
      {
        error:
          "Failed to generate PDF. If this is a fresh install, run `npx playwright install chromium` and try again.",
      },
      { status: 500 }
    );
  }

  const filename = `${sanitizeFilename(resume.title)}.pdf`;
  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
}

function sanitizeFilename(title: string): string {
  const cleaned = title
    .trim()
    .replace(/[^a-zA-Z0-9\-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return cleaned || "resume";
}
