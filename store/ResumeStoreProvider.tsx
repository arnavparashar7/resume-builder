"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { useStore } from "zustand";
import { createResumeStore, type ResumeStore, type ResumeStoreState } from "@/store/resumeStore";
import type { ResumeData } from "@/types/resume";

const ResumeStoreContext = createContext<ResumeStore | null>(null);

/**
 * Wraps a subtree with a resume-specific store instance. Using a factory +
 * context (rather than a single module-level store) means navigating between
 * two different resumes in the editor never leaks state from one into the
 * other, and each editor page mount gets a clean store seeded from the data
 * that page loaded.
 */
export function ResumeStoreProvider({ resume, children }: { resume: ResumeData; children: ReactNode }) {
  const storeRef = useRef<ResumeStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createResumeStore(resume);
  }
  return <ResumeStoreContext.Provider value={storeRef.current}>{children}</ResumeStoreContext.Provider>;
}

export function useResumeStore<T>(selector: (state: ResumeStoreState) => T): T {
  const store = useContext(ResumeStoreContext);
  if (!store) throw new Error("useResumeStore must be used within a ResumeStoreProvider");
  return useStore(store, selector);
}

/** Escape hatch for code that needs the raw store (e.g. the autosave hook, which subscribes outside React's render cycle). */
export function useResumeStoreApi(): ResumeStore {
  const store = useContext(ResumeStoreContext);
  if (!store) throw new Error("useResumeStoreApi must be used within a ResumeStoreProvider");
  return store;
}
