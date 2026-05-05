/**
 * Client-side parser for Nest chat SSE (`POST .../chat/.../messages/stream`).
 * Each event is `data: <json or [DONE]>\n\n` per `chat.controller.ts`.
 */

export type SseCitation = { source: string; excerpt: string };

export type SseInStreamError = { error: { code: string; message: string } };

export type SseDonePersonal = {
  done: true;
  conversationId: string;
  messageId: string;
  citations?: SseCitation[];
};

export type SseDoneGeneral = {
  done: true;
  reply: string;
  messageId: string;
  citations?: SseCitation[];
};

/**
 * Process one `data` payload string (content after `data: `) from a single SSE line.
 */
export function parseChatSseDataLine(rawData: string):
  | { type: "token"; token: string }
  | { type: "donePersonal"; payload: SseDonePersonal }
  | { type: "doneGeneral"; payload: SseDoneGeneral }
  | { type: "inStreamError"; payload: SseInStreamError }
  | { type: "doneLine" }
  | null {
  const t = rawData.trim();
  if (t === "[DONE]") {
    return { type: "doneLine" };
  }
  try {
    const parsed: unknown = JSON.parse(t);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    if ("error" in parsed) {
      const p = parsed as SseInStreamError;
      if (p.error && typeof p.error.message === "string") {
        return { type: "inStreamError", payload: p };
      }
    }
    if ("token" in parsed && typeof (parsed as { token: unknown }).token === "string") {
      return { type: "token", token: (parsed as { token: string }).token };
    }
    if ("done" in parsed && (parsed as { done?: unknown }).done === true) {
      const p = parsed as Record<string, unknown>;
      if (typeof p.messageId === "string" && typeof p.conversationId === "string") {
        return {
          type: "donePersonal",
          payload: {
            done: true,
            conversationId: p.conversationId,
            messageId: p.messageId,
            citations: p.citations as SseCitation[] | undefined,
          },
        };
      }
      if (typeof p.messageId === "string" && typeof p.reply === "string") {
        return {
          type: "doneGeneral",
          payload: {
            done: true,
            reply: p.reply,
            messageId: p.messageId,
            citations: p.citations as SseCitation[] | undefined,
          },
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Split a buffer on complete SSE events (`\n\n`), return complete event strings (each may contain multiple `data:` lines; Nest uses one JSON line per event).
 */
export function splitSseEvents(buffer: string): { complete: string[]; rest: string } {
  const events: string[] = [];
  let rest = buffer;
  for (;;) {
    const idx = rest.indexOf("\n\n");
    if (idx === -1) {
      return { complete: events, rest };
    }
    events.push(rest.slice(0, idx));
    rest = rest.slice(idx + 2);
  }
}

/** Get `data: ...` payload lines from one SSE event block. */
function dataLinesFromEvent(block: string): string[] {
  const out: string[] = [];
  for (const line of block.split("\n")) {
    const s = line.replace(/\r$/, "");
    if (s.startsWith("data:")) {
      out.push(s.slice(5).trim());
    }
  }
  return out;
}

/**
 * Read SSE stream: invoke callbacks until done payload, [DONE] line, in-stream error, or abort.
 */
export async function readChatSse(
  body: ReadableStream<Uint8Array> | null,
  handlers: {
    onToken: (t: string) => void;
    onDone: (p: SseDonePersonal | SseDoneGeneral) => void;
    onInStreamError: (p: SseInStreamError) => void;
  },
  signal?: AbortSignal,
): Promise<void> {
  if (!body) {
    return;
  }
  const dec = new TextDecoder();
  let acc = "";
  const reader = body.getReader();
  for (;;) {
    if (signal?.aborted) {
      await reader.cancel();
      return;
    }
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    acc += dec.decode(value, { stream: true });
    const { complete, rest } = splitSseEvents(acc);
    acc = rest;
    for (const block of complete) {
      for (const dataStr of dataLinesFromEvent(block)) {
        const ev = parseChatSseDataLine(dataStr);
        if (!ev) {
          continue;
        }
        if (ev.type === "token") {
          handlers.onToken(ev.token);
        } else if (ev.type === "donePersonal") {
          handlers.onDone(ev.payload);
          return;
        } else if (ev.type === "doneGeneral") {
          handlers.onDone(ev.payload);
          return;
        } else if (ev.type === "inStreamError") {
          handlers.onInStreamError(ev.payload);
          return;
        } else if (ev.type === "doneLine") {
          return;
        }
      }
    }
  }
  if (acc.trim().length > 0) {
    const { complete: tailBlocks } = splitSseEvents(`${acc}\n\n`);
    for (const block of tailBlocks) {
      for (const dataStr of dataLinesFromEvent(block)) {
        const ev = parseChatSseDataLine(dataStr);
        if (!ev) {
          continue;
        }
        if (ev.type === "token") {
          handlers.onToken(ev.token);
        } else if (ev.type === "donePersonal") {
          handlers.onDone(ev.payload);
          return;
        } else if (ev.type === "doneGeneral") {
          handlers.onDone(ev.payload);
          return;
        } else if (ev.type === "inStreamError") {
          handlers.onInStreamError(ev.payload);
          return;
        } else if (ev.type === "doneLine") {
          return;
        }
      }
    }
  }
}
