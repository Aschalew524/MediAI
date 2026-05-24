import type { ChatCitation } from "@/lib/services/app-content";

export function ChatCitations({ citations }: { citations: ChatCitation[] }) {
  if (!citations.length) {
    return null;
  }

  return (
    <div className="mt-3 border-t border-primary/10 pt-3" aria-label="Guideline sources">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Sources (educational guidelines)
      </p>
      <ul className="mt-2 space-y-2">
        {citations.map((c, i) => (
          <li
            key={`${c.source}-${i}`}
            className="rounded-lg bg-background/80 px-3 py-2 text-xs leading-relaxed text-muted-foreground"
          >
            <span className="font-medium text-foreground/80">
              {formatSource(c.source ?? "guideline")}
            </span>
            <p className="mt-1 line-clamp-3">{c.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatSource(source: string): string {
  const base = source.replace(/^ingest:/, "").replace(/#\w+$/, "");
  return base.split("/").pop() ?? source;
}
