import type { ComponentType } from "react";
import type { ResumeData } from "@/types/resume";

// ============================================================================
// Template contract
// ----------------------------------------------------------------------------
// A template is a pure function of ResumeData -> JSX. It receives NOTHING
// else: no database access, no editor state, no callbacks. That constraint is
// what guarantees "changing templates only changes presentation, not
// content" and lets the exact same component be used for:
//   1. The live editor preview (wrapped in an A4-scaled viewport)
//   2. The PDF export (rendered server-side by Playwright, unscaled, at
//      true A4 print dimensions)
//
// If preview and PDF ever look different, the bug is in how the component is
// hosted (CSS reset, print styles, scaling), never in the component itself -
// because it's the same component in both places.
// ============================================================================

export interface ResumeTemplateProps {
  data: ResumeData;
  /**
   * True only when rendering for Playwright's print pipeline. Use sparingly -
   * ideally never - and only for things that are genuinely print-only, e.g.
   * suppressing an interactive affordance that would otherwise render as
   * dead UI in the PDF. Never use this to change layout, spacing, or typography;
   * that would reintroduce the preview/PDF mismatch this architecture exists
   * to prevent.
   */
  isPrintMode?: boolean;
}

export type ResumeTemplateComponent = ComponentType<ResumeTemplateProps>;

export interface TemplateDefinition {
  id: string; // stored on Resume.templateId - must be stable, never renamed
  name: string; // shown in the template picker UI
  description: string;
  thumbnail?: string; // path under /public, optional preview image
  component: ResumeTemplateComponent;
  /** CSS class applied to the page wrapper; templates own their own page-level styles (margins etc). */
  pageClassName?: string;
}
