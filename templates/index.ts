import type { TemplateDefinition } from "./types";
import ClassicTemplate from "./classic/ClassicTemplate";

// ============================================================================
// Template registry
// ----------------------------------------------------------------------------
// To add a new template later:
//   1. Create templates/<id>/<Id>Template.tsx implementing ResumeTemplateProps
//   2. Register it below
//   3. It immediately shows up in the template picker, works in the live
//      preview, and works in PDF export - with ZERO changes to the editor,
//      the database schema, or the PDF route.
// ============================================================================

export const TEMPLATES: Record<string, TemplateDefinition> = {
  classic: {
    id: "classic",
    name: "Classic",
    description: "Compact, traditional layout with gray section bars - modeled on a classic one-page A4 resume.",
    component: ClassicTemplate,
  },
};

export const DEFAULT_TEMPLATE_ID = "classic";

export function getTemplate(id: string): TemplateDefinition {
  return TEMPLATES[id] ?? TEMPLATES[DEFAULT_TEMPLATE_ID];
}

export function listTemplates(): TemplateDefinition[] {
  return Object.values(TEMPLATES);
}
