"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Block =
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

/** Renders assistant chat text with headings, lists, and emphasis. */
export function ChatMessageContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const blocks = parseMarkdownBlocks(content);
  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3 text-base leading-7 text-foreground/90", className)}>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "h3":
      return (
        <h3 className="text-sm font-semibold tracking-tight text-primary first:mt-0">
          {renderInline(block.text)}
        </h3>
      );
    case "p":
      return <p>{renderInline(block.text)}</p>;
    case "ul":
      return (
        <ul className="list-disc space-y-1.5 pl-5">
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="list-decimal space-y-1.5 pl-5">
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ol>
      );
    default:
      return null;
  }
}

function parseMarkdownBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let ul: string[] = [];
  let ol: string[] = [];

  const flushLists = () => {
    if (ul.length) {
      blocks.push({ type: "ul", items: [...ul] });
      ul = [];
    }
    if (ol.length) {
      blocks.push({ type: "ol", items: [...ol] });
      ol = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushLists();
      continue;
    }

    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      flushLists();
      blocks.push({ type: "h3", text: h3[1].trim() });
      continue;
    }

    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flushLists();
      blocks.push({ type: "h3", text: h2[1].trim() });
      continue;
    }

    const bullet = line.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      if (ol.length) {
        blocks.push({ type: "ol", items: [...ol] });
        ol = [];
      }
      ul.push(bullet[1].trim());
      continue;
    }

    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    if (numbered) {
      if (ul.length) {
        blocks.push({ type: "ul", items: [...ul] });
        ul = [];
      }
      ol.push(numbered[1].trim());
      continue;
    }

    flushLists();
    blocks.push({ type: "p", text: line });
  }

  flushLists();
  return blocks;
}

/** Supports [links](url), **bold**, *italic*, and `code` spans. */
function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const re =
    /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<Fragment key={key++}>{text.slice(last, match.index)}</Fragment>);
    }
    const token = match[0];
    const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const label = linkMatch[1];
      const href = linkMatch[2].trim();
      parts.push(
        <ChatInlineLink key={key++} href={href}>
          {label}
        </ChatInlineLink>,
      );
    } else if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("*")) {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    } else {
      parts.push(
        <code
          key={key++}
          className="rounded bg-primary/8 px-1 py-0.5 text-sm font-mono text-foreground"
        >
          {token.slice(1, -1)}
        </code>,
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    parts.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function ChatInlineLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const className =
    "font-medium text-primary underline underline-offset-2 hover:text-primary/80";

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return <span className={className}>{children}</span>;
}
