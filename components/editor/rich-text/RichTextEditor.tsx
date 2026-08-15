"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect, useRef } from "react";
import clsx from "clsx";
import { buildExtensions, type EditorVariant } from "@/lib/tiptap/extensions";
import { RichTextToolbar } from "@/components/editor/rich-text/RichTextToolbar";
import type { RichTextDoc } from "@/types/resume";
import { EMPTY_RICH_TEXT } from "@/types/resume";

interface RichTextEditorProps {
  content: RichTextDoc | null | undefined;
  onChange: (doc: RichTextDoc) => void;
  variant?: EditorVariant;
  placeholder?: string;
  className?: string;
}

/**
 * The single rich text editing surface used everywhere in the app -
 * education/entry descriptions, bullet text, and freeform (Skills-style)
 * sections all render this component with a different `variant`. Content is
 * always read/written as a Tiptap JSON document (RichTextDoc), matching
 * exactly what's persisted to the database - there's no HTML in between.
 */
export function RichTextEditor({ content, onChange, variant = "paragraph", placeholder, className }: RichTextEditorProps) {
  // Tracks whether the last content change originated from this editor
  // instance, so an external prop update (e.g. store hydration on load)
  // doesn't fight with the user's in-progress typing/selection.
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: buildExtensions(variant, placeholder),
    content: (content ?? EMPTY_RICH_TEXT) as object,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: clsx(
          "prose-sm max-w-none focus:outline-none px-2.5 py-1.5 text-sm text-slate-900 min-h-[2.25rem]",
          variant === "inline" && "min-h-0"
        ),
      },
      // Bullets are single-line: swallow Enter/Shift+Enter instead of
      // inserting a hard break or new paragraph.
      handleKeyDown: variant === "inline" ? (_view, event) => event.key === "Enter" : undefined,
    },
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      onChange(editor.getJSON() as RichTextDoc);
    },
  });

  // Keep the editor in sync if `content` changes from outside (e.g. loading
  // a different resume, or an external store reset) without clobbering the
  // user's own edits mid-keystroke.
  useEffect(() => {
    if (!editor) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const current = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(content ?? EMPTY_RICH_TEXT);
    if (current !== next) {
      editor.commands.setContent((content ?? EMPTY_RICH_TEXT) as object, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editor]);

  if (!editor) {
    // Matches the mounted layout's approximate height so fields don't jump
    // once Tiptap finishes its (deliberately deferred, see immediatelyRender
    // above) first render - most noticeable when several editors are on
    // screen at once, e.g. a long bullet list.
    return (
      <div className={clsx(className, "animate-pulse")}>
        <div className="h-8 rounded-t-md bg-slate-50 border border-slate-200 border-b-0" />
        <div className={clsx("rounded-b-md bg-slate-50 border border-slate-200", variant === "inline" ? "h-8" : "h-16")} />
      </div>
    );
  }

  return (
    <div className={className}>
      <RichTextToolbar editor={editor} showLists={variant === "block"} showAlign={variant !== "inline"} />
      <EditorContent editor={editor} className="border border-slate-200 rounded-b-md bg-white focus-within:ring-2 focus-within:ring-slate-400 focus-within:border-slate-400" />
    </div>
  );
}
