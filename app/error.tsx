"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center gap-3">
      <AlertTriangle className="text-amber-500" size={40} />
      <h1 className="text-lg font-semibold text-slate-800">Something went wrong</h1>
      <p className="text-sm text-slate-500 max-w-sm">
        {error.message || "An unexpected error occurred."} If this keeps happening, check that your database is
        running and reachable.
      </p>
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={reset}
          className="text-sm font-medium bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700"
        >
          Try again
        </button>
        <Link href="/dashboard" className="text-sm font-medium text-slate-500 px-4 py-2 rounded-lg hover:bg-slate-100">
          Back to my resumes
        </Link>
      </div>
    </main>
  );
}
