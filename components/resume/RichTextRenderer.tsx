import type { RichTextDoc, RichTextNode, RichTextMark } from "@/types/resume";

// ============================================================================
// RichTextDoc -> JSX
// ----------------------------------------------------------------------------
// Every template renders rich text through this component instead of
// reimplementing Tiptap-JSON-to-markup logic itself. Because the live
// preview and the PDF export (Checkpoint 5) both render the exact same
// template component tree, this is also the thing that guarantees bold/
// italic/links/lists look identical in the browser and in the exported PDF -
// there's no separate "PDF renderer" for rich text.
// ============================================================================

export function RichTextRenderer({ doc }: { doc: RichTextDoc | null | undefined }) {
  if (!doc?.content) return null;
  return <>{doc.content.map((node, i) => <BlockNode key={i} node={node} />)}</>;
}

/** Renders just the inline content of a doc's first paragraph, with no wrapping <p> - for single-line contexts like bullets. */
export function RichTextInline({ doc }: { doc: RichTextDoc | null | undefined }) {
  const first = doc?.content?.[0];
  if (!first?.content) return null;
  return <>{first.content.map((node, i) => <InlineNode key={i} node={node} />)}</>;
}

function BlockNode({ node }: { node: RichTextNode }) {
  switch (node.type) {
    case "paragraph": {
      const align = (node.attrs?.textAlign as string | undefined) ?? undefined;
      if (!node.content?.length) return <p style={{ minHeight: "1em" }} />;
      return (
        <p style={align && align !== "left" ? { textAlign: align as "center" | "right" | "justify" } : undefined}>
          {node.content.map((child, i) => (
            <InlineNode key={i} node={child} />
          ))}
        </p>
      );
    }
    case "bulletList":
      return (
        <ul className="list-disc pl-5">
          {(node.content ?? []).map((child, i) => (
            <BlockNode key={i} node={child} />
          ))}
        </ul>
      );
    case "orderedList":
      return (
        <ol className="list-decimal pl-5">
          {(node.content ?? []).map((child, i) => (
            <BlockNode key={i} node={child} />
          ))}
        </ol>
      );
    case "listItem":
      return (
        <li>
          {(node.content ?? []).map((child, i) => (
            <BlockNode key={i} node={child} />
          ))}
        </li>
      );
    default:
      // Unknown/unsupported block node - render children defensively rather than dropping content silently.
      return <>{(node.content ?? []).map((child, i) => <BlockNode key={i} node={child} />)}</>;
  }
}

function InlineNode({ node }: { node: RichTextNode }) {
  if (node.type === "hardBreak") return <br />;
  if (node.type === "text") return applyMarks(node.text ?? "", node.marks);
  // Unknown inline node with children (defensive fallback)
  if (node.content) return <>{node.content.map((child, i) => <InlineNode key={i} node={child} />)}</>;
  return null;
}

function applyMarks(text: string, marks: RichTextMark[] | undefined): React.ReactNode {
  if (!marks || marks.length === 0) return text;

  return marks.reduce<React.ReactNode>((acc, mark) => {
    switch (mark.type) {
      case "bold":
        return <strong>{acc}</strong>;
      case "italic":
        return <em>{acc}</em>;
      case "underline":
        return <u>{acc}</u>;
      case "strike":
        return <s>{acc}</s>;
      case "link": {
        const href = (mark.attrs?.href as string | undefined) ?? "#";
        return (
          <a href={href} className="underline" style={{ color: "inherit" }} target="_blank" rel="noopener noreferrer">
            {acc}
          </a>
        );
      }
      case "highlight": {
        const color = (mark.attrs?.color as string | undefined) ?? "#fef08a";
        return <mark style={{ backgroundColor: color, padding: "0 1px" }}>{acc}</mark>;
      }
      case "textStyle": {
        const attrs = mark.attrs ?? {};
        const style: React.CSSProperties = {};
        if (attrs.color) style.color = attrs.color as string;
        if (attrs.fontFamily) style.fontFamily = attrs.fontFamily as string;
        if (attrs.fontSize) style.fontSize = attrs.fontSize as string;
        if (Object.keys(style).length === 0) return acc;
        return <span style={style}>{acc}</span>;
      }
      default:
        return acc;
    }
  }, text);
}
