import React from "react";

/**
 * Small, dependency-free markdown renderer for long-form content (legal pages,
 * admin preview). It is a pure component (no hooks / no "use client") so it can
 * be rendered on the server *and* imported into client components.
 *
 * Supported syntax:
 *   ## Heading            → h2
 *   ### Heading           → h3
 *   - item                → unordered list
 *   1. item               → ordered list
 *   ---                   → horizontal rule
 *   **bold**  *italic*    → inline emphasis
 *   [text](href)          → links (mailto/internal/external handled)
 *   blank line            → paragraph break
 */

type Inline = React.ReactNode;

/** Parse inline emphasis + links within a single line into React nodes. */
function renderInline(text: string, keyPrefix: string): Inline[] {
  const nodes: Inline[] = [];
  // Token regex: links, bold, italic (evaluated left-to-right).
  const pattern = /(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;

    if (token.startsWith("[")) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        const external = /^https?:\/\//i.test(href);
        nodes.push(
          <a
            key={key}
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="text-[#FF561E] font-semibold underline underline-offset-2 break-words"
          >
            {label}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    } else if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold text-[#1A1D20]">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("*")) {
      nodes.push(
        <em key={key}>{token.slice(1, -1)}</em>,
      );
    } else {
      nodes.push(token);
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

const h2Cls = "text-[20px] sm:text-[22px] font-bold text-[#1A1D20] tracking-tight mt-8 mb-3 first:mt-0";
const h3Cls = "text-[16px] sm:text-[17px] font-bold text-[#1A1D20] mt-6 mb-2";
const pCls = "mb-3 leading-[1.8]";
const ulCls = "list-disc pl-5 space-y-2 mb-4";
const olCls = "list-decimal pl-5 space-y-2 mb-4";

export default function MarkdownContent({ content, className }: { content: string; className?: string }) {
  const lines = (content || "").replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line → skip (paragraph separation handled by grouping below).
    if (trimmed === "") {
      i++;
      continue;
    }

    // Horizontal rule.
    if (/^---+$/.test(trimmed)) {
      blocks.push(<hr key={`b${key++}`} className="my-8 border-gray-100" />);
      i++;
      continue;
    }

    // Headings.
    if (trimmed.startsWith("### ")) {
      blocks.push(<h3 key={`b${key++}`} className={h3Cls}>{renderInline(trimmed.slice(4), `h3${key}`)}</h3>);
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push(<h2 key={`b${key++}`} className={h2Cls}>{renderInline(trimmed.slice(3), `h2${key}`)}</h2>);
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      blocks.push(<h2 key={`b${key++}`} className={h2Cls}>{renderInline(trimmed.slice(2), `h1${key}`)}</h2>);
      i++;
      continue;
    }

    // Unordered list.
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={`b${key++}`} className={ulCls}>
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `ul${key}-${idx}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list.
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={`b${key++}`} className={olCls}>
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `ol${key}-${idx}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Paragraph: gather consecutive non-blank, non-structural lines.
    const paraLines: string[] = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (
        t === "" ||
        /^---+$/.test(t) ||
        t.startsWith("#") ||
        /^[-*]\s+/.test(t) ||
        /^\d+\.\s+/.test(t)
      ) {
        break;
      }
      paraLines.push(t);
      i++;
    }
    blocks.push(
      <p key={`b${key++}`} className={pCls}>
        {renderInline(paraLines.join(" "), `p${key}`)}
      </p>,
    );
  }

  return <div className={className}>{blocks}</div>;
}
