"use client";

import { useResumeStore } from "@/store/ResumeStoreProvider";
import { Check, Loader2, AlertCircle } from "lucide-react";

export function SaveStatusBadge() {
  const status = useResumeStore((s) => s.saveStatus);
  const error = useResumeStore((s) => s.saveError);

  if (status === "idle") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
        <Check size={12} /> All changes saved
      </span>
    );
  }
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <Loader2 size={12} className="animate-spin" /> Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
        <Check size={12} /> Saved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400" title={error ?? undefined}>
      <AlertCircle size={12} /> Unable to save - retrying…
    </span>
  );
}
