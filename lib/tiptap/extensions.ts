import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { FontFamily } from "@tiptap/extension-font-family";
import { Highlight } from "@tiptap/extension-highlight";
import { TextAlign } from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { FontSize } from "@/lib/tiptap/fontSize";

export type EditorVariant = "block" | "paragraph" | "inline";

// ============================================================================
// Extension sets per variant
// ----------------------------------------------------------------------------
// - "block":     freeform RICHTEXT sections (e.g. Skills). Full toolbar,
//                including bullet/numbered lists and text alignment.
// - "paragraph": entry/education descriptions. Marks + font family/size/
//                color/highlight/links, multiple paragraphs, but NO lists -
//                bulleted content on a resume belongs in the dedicated
//                bullet-tree UI (BulletListEditor), not inside a description.
// - "inline":    a single bullet's text. Same marks as "paragraph" but
//                constrained to one paragraph (Enter is suppressed - see
//                RichTextEditor) and no alignment, since a bullet is one line.
// ============================================================================

export function buildExtensions(variant: EditorVariant, placeholder?: string) {
  const showLists = variant === "block";

  return [
    StarterKit.configure({
      heading: false,
      blockquote: false,
      codeBlock: false,
      horizontalRule: false,
      bulletList: showLists ? undefined : false,
      orderedList: showLists ? undefined : false,
      listItem: showLists ? undefined : false,
      listKeymap: showLists ? undefined : false,
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      },
    }),
    TextStyle,
    Color,
    FontFamily,
    FontSize,
    Highlight.configure({ multicolor: true }),
    ...(variant !== "inline" ? [TextAlign.configure({ types: ["paragraph"] })] : []),
    ...(placeholder ? [Placeholder.configure({ placeholder })] : []),
  ];
}
