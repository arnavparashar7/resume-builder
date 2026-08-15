"use client";

import { useEffect, useRef } from "react";
import { useResumeStoreApi } from "@/store/ResumeStoreProvider";

const DEBOUNCE_MS = 1200;

/**
 * Subscribes to the resume store's content (title, templateId, personalInfo,
 * sections - NOT saveStatus, to avoid re-triggering itself) and debounces a
 * full-document save to PUT /api/resumes/[id]. See lib/resume/sync.ts for
 * why saves are "send the whole document" rather than granular patches.
 *
 * Mount this once near the top of the editor (see EditorShell).
 */
export function useAutosave(resumeId: string) {
  const store = useResumeStoreApi();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRunRef = useRef(true);
  const inFlightRef = useRef(false);
  const pendingAgainRef = useRef(false);

  useEffect(() => {
    const save = async () => {
      if (inFlightRef.current) {
        // A save is already in progress; queue exactly one more run after it finishes.
        pendingAgainRef.current = true;
        return;
      }
      inFlightRef.current = true;
      const { resume, markSaving, markSaved, markSaveError } = store.getState();
      markSaving();
      try {
        const res = await fetch(`/api/resumes/${resumeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: resume.title,
            templateId: resume.templateId,
            personalInfo: resume.personalInfo,
            sections: resume.sections,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Save failed (${res.status})`);
        }
        const body = await res.json();
        markSaved(body.resume.updatedAt);
      } catch (err) {
        markSaveError(err instanceof Error ? err.message : "Failed to save");
      } finally {
        inFlightRef.current = false;
        if (pendingAgainRef.current) {
          pendingAgainRef.current = false;
          save();
        }
      }
    };

    const unsubscribe = store.subscribe((state, prevState) => {
      const changed =
        state.resume.title !== prevState.resume.title ||
        state.resume.templateId !== prevState.resume.templateId ||
        state.resume.personalInfo !== prevState.resume.personalInfo ||
        state.resume.sections !== prevState.resume.sections;
      if (!changed) return;

      if (isFirstRunRef.current) {
        // Don't fire a save purely from initial hydration.
        isFirstRunRef.current = false;
        return;
      }

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(save, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  // Warn on tab close if there's an unsaved, in-flight, or queued change.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const status = store.getState().saveStatus;
      if (status === "saving" || timerRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [store]);
}
