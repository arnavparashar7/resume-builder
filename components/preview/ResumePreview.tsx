"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { getTemplate } from "@/templates";
import { isDocEmpty } from "@/lib/resume/richtext";
import type { ResumeData } from "@/types/resume";
import { FileText } from "lucide-react";

const ZOOM_LEVELS = [0.5, 0.65, 0.75, 0.9, 1];
const DEFAULT_ZOOM_INDEX = 2; // 0.75

/**
 * Renders `data` through its selected template at TRUE A4 print dimensions
 * (the template component itself sets `width: 210mm`), then scales the
 * whole thing down visually with a CSS transform. This is deliberate: the
 * template never knows it's being previewed vs. printed, which is exactly
 * what keeps this view honest - what you see here is what Playwright will
 * print in Checkpoint 5, not an approximation of it.
 */
export function ResumePreview({ data }: { data: ResumeData }) {
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const zoom = ZOOM_LEVELS[zoomIndex];
  const template = getTemplate(data.templateId);
  const Template = template.component;

  // A4 at 96 CSS px/inch: 210mm = 793.7px, 297mm = 1122.5px.
  const PAGE_WIDTH_PX = 793.7;
  const PAGE_HEIGHT_PX = 1122.5;

  const hasContent =
    data.personalInfo.name.trim().length > 0 ||
    data.sections.some((s) => {
      if (!s.isVisible) return false;
      if (s.type === "EDUCATION") return (s.educationEntries?.length ?? 0) > 0;
      if (s.type === "ENTRIES") return (s.entries?.length ?? 0) > 0;
      return !isDocEmpty(s.richContent);
    });

  return (
    <div className="flex flex-col h-full bg-slate-100">
      <div className="flex items-center justify-center gap-1.5 border-b border-slate-200 bg-white py-1.5 shrink-0">
        <button
          onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
          disabled={zoomIndex === 0}
          className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
          title="Zoom out"
        >
          <ZoomOut size={14} />
        </button>
        <span className="text-xs text-slate-500 w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
          disabled={zoomIndex === ZOOM_LEVELS.length - 1}
          className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
          title="Zoom in"
        >
          <ZoomIn size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-auto py-6 flex justify-center">
        <div
          style={{
            width: PAGE_WIDTH_PX * zoom,
            height: PAGE_HEIGHT_PX * zoom,
          }}
        >
          <div
            className="bg-white shadow-md origin-top-left relative"
            style={{
              width: PAGE_WIDTH_PX,
              minHeight: PAGE_HEIGHT_PX,
              transform: `scale(${zoom})`,
            }}
          >
            <Template data={data} />
            {!hasContent && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-12">
                <FileText className="text-slate-200 mb-3" size={36} />
                <p className="text-sm text-slate-400">Your resume will appear here as you add content</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
