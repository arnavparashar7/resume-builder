import type { RichTextDoc, RichTextNode } from "@/types/resume";
import { EMPTY_RICH_TEXT } from "@/types/resume";

// ============================================================================
// Interim plain-text <-> RichTextDoc bridge
// ----------------------------------------------------------------------------
// Checkpoint 2 doesn't wire up Tiptap yet, but every description/bullet field
// is ALREADY stored as a structured Tiptap JSON document (see types/resume.ts)
// so that Checkpoint 3 can drop the real rich text editor in without a data
// migration. Until then, the editor UI uses plain <textarea>s that read/write
// through these two functions, which represent plain text as the simplest
// valid Tiptap doc: one paragraph per line, no marks.
// ============================================================================

export function plainTextToDoc(text: string): RichTextDoc {
  const lines = text.split("\n");
  return {
    type: "doc",
    content: lines.map((line) => ({
      type: "paragraph",
      content: line.length ? [{ type: "text", text: line }] : [],
    })),
  };
}

export function docToPlainText(doc: RichTextDoc | null | undefined): string {
  if (!doc?.content) return "";
  return doc.content
    .map((node) => nodeToPlainText(node))
    .join("\n");
}

function nodeToPlainText(node: RichTextNode): string {
  if (node.type === "text") return node.text ?? "";
  if (!node.content) return "";
  return node.content.map(nodeToPlainText).join(node.type === "paragraph" ? "" : "\n");
}

export function isDocEmpty(doc: RichTextDoc | null | undefined): boolean {
  return docToPlainText(doc).trim().length === 0;
}

export { EMPTY_RICH_TEXT };
