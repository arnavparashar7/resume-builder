import { notFound } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { getResumeData } from "@/lib/resume/sync";
import { getTemplate } from "@/templates";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

// NOTE on auth: this route supports two forms of authentication:
// 1. Token-based authentication (bypassing session): used by the local Playwright
//    PDF generator which doesn't carry session cookies. The token is a secure SHA256 HMAC
//    of the resume ID signed with the server's AUTH_SECRET.
// 2. Session-based authentication (default): used by the user's browser, checked via getCurrentUserId().
export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  let userId: string | null = null;
  let isValidToken = false;

  if (token && typeof token === "string" && process.env.AUTH_SECRET) {
    const expectedToken = crypto
      .createHmac("sha256", process.env.AUTH_SECRET)
      .update(id)
      .digest("hex");
    if (token === expectedToken) {
      isValidToken = true;
      const resume = await prisma.resume.findUnique({ where: { id }, select: { userId: true } });
      if (resume) {
        userId = resume.userId;
      }
    }
  }

  if (!isValidToken || !userId) {
    userId = await getCurrentUserId();
  }

  const resume = await getResumeData(id, userId);
  if (!resume) notFound();

  const { component: Template } = getTemplate(resume.templateId);
  return <Template data={resume} isPrintMode />;
}
