import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function ResumeNotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center gap-3">
      <FileQuestion className="text-slate-300" size={40} />
      <h1 className="text-lg font-semibold text-slate-800">Resume not found</h1>
      <p className="text-sm text-slate-500 max-w-xs">
        This resume doesn&apos;t exist or may have been deleted.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 text-sm font-medium bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700"
      >
        Back to my resumes
      </Link>
    </main>
  );
}
