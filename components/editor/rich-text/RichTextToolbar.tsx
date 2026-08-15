"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link as LinkIcon,
  Unlink,
  Highlighter,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
} from "lucide-react";
import clsx from "clsx";

const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Calibri", value: "Calibri, Candara, sans-serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
];

const FONT_SIZES = ["10px", "11px", "12px", "13px", "14px", "16px", "18px", "20px", "24px"];

export function RichTextToolbar({
  editor,
  showLists,
  showAlign,
}: {
  editor: Editor;
  showLists: boolean;
  showAlign: boolean;
}) {
  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border border-slate-200 border-b-0 rounded-t-md bg-slate-50 px-1.5 py-1">
      <select
        className="text-xs border border-slate-200 rounded px-1.5 py-1 bg-white mr-1"
        value={editor.getAttributes("textStyle").fontFamily ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          if (value) editor.chain().focus().setFontFamily(value).run();
          else editor.chain().focus().unsetFontFamily().run();
        }}
        title="Font family"
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f.label} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <select
        className="text-xs border border-slate-200 rounded px-1.5 py-1 bg-white mr-1.5"
        value={editor.getAttributes("textStyle").fontSize ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          if (value) editor.chain().focus().setFontSize(value).run();
          else editor.chain().focus().unsetFontSize().run();
        }}
        title="Font size"
      >
        <option value="">Size</option>
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <Divider />

      <ToolButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
        <Bold size={14} />
      </ToolButton>
      <ToolButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
        <Italic size={14} />
      </ToolButton>
      <ToolButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
        <Underline size={14} />
      </ToolButton>
      <ToolButton active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
        <Strikethrough size={14} />
      </ToolButton>

      <Divider />

      <label className="relative p-1 rounded hover:bg-slate-200 cursor-pointer flex items-center" title="Text color">
        <span className="sr-only">Text color</span>
        <span
          className="w-3.5 h-3.5 rounded-sm border border-slate-300 block"
          style={{ background: editor.getAttributes("textStyle").color || "#0f172a" }}
        />
        <input
          type="color"
          className="w-0 h-0 opacity-0 absolute"
          value={editor.getAttributes("textStyle").color || "#0f172a"}
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        />
      </label>
      <ToolButton active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()} title="Highlight">
        <Highlighter size={14} />
      </ToolButton>
      <ToolButton active={editor.isActive("link")} onClick={setLink} title="Add link">
        <LinkIcon size={14} />
      </ToolButton>
      {editor.isActive("link") && (
        <ToolButton onClick={() => editor.chain().focus().unsetLink().run()} title="Remove link">
          <Unlink size={14} />
        </ToolButton>
      )}

      {showLists && (
        <>
          <Divider />
          <ToolButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
            <List size={14} />
          </ToolButton>
          <ToolButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
            <ListOrdered size={14} />
          </ToolButton>
        </>
      )}

      {showAlign && (
        <>
          <Divider />
          <ToolButton active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align left">
            <AlignLeft size={14} />
          </ToolButton>
          <ToolButton active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align center">
            <AlignCenter size={14} />
          </ToolButton>
          <ToolButton active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align right">
            <AlignRight size={14} />
          </ToolButton>
          <ToolButton active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="Justify">
            <AlignJustify size={14} />
          </ToolButton>
        </>
      )}

      <Divider />
      <ToolButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
        <Undo2 size={14} />
      </ToolButton>
      <ToolButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
        <Redo2 size={14} />
      </ToolButton>
    </div>
  );
}

function ToolButton({ children, onClick, active, title }: { children: React.ReactNode; onClick: () => void; active?: boolean; title: string }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()} // keep editor selection/focus intact
      onClick={onClick}
      className={clsx("p-1.5 rounded hover:bg-slate-200 text-slate-600", active && "bg-slate-800 text-white hover:bg-slate-800")}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-4 bg-slate-200 mx-1" />;
}
