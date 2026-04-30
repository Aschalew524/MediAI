import { describe, expect, it } from "vitest";

import { parseChatSseDataLine, readChatSse, splitSseEvents } from "@/lib/chat-sse";

describe("parseChatSseDataLine", () => {
  it("parses token", () => {
    const r = parseChatSseDataLine('{"token":"hel"}');
    expect(r).toEqual({ type: "token", token: "hel" });
  });

  it("parses done personal", () => {
    const r = parseChatSseDataLine(
      '{"done":true,"conversationId":"c1","messageId":"m1","citations":[]}',
    );
    expect(r?.type).toBe("donePersonal");
    if (r?.type === "donePersonal") {
      expect(r.payload.conversationId).toBe("c1");
      expect(r.payload.messageId).toBe("m1");
    }
  });

  it("parses done general", () => {
    const r = parseChatSseDataLine(
      '{"done":true,"reply":"full text","messageId":"m2"}',
    );
    expect(r?.type).toBe("doneGeneral");
    if (r?.type === "doneGeneral") {
      expect(r.payload.reply).toBe("full text");
    }
  });

  it("parses in-stream error", () => {
    const r = parseChatSseDataLine('{"error":{"code":"x","message":"bad"}}');
    expect(r?.type).toBe("inStreamError");
  });

  it("parses [DONE] line", () => {
    expect(parseChatSseDataLine("[DONE]")?.type).toBe("doneLine");
  });
});

describe("splitSseEvents", () => {
  it("splits on double newline", () => {
    const a = 'data: {"token":"a"}\n\ndata: {"token":"b"}\n\n';
    const { complete, rest } = splitSseEvents(a);
    expect(complete.length).toBe(2);
    expect(rest).toBe("");
  });
});

describe("readChatSse", () => {
  it("reads a minimal stream", async () => {
    const text =
      'data: {"token":"hi"}\n\ndata: {"done":true,"conversationId":"c","messageId":"m"}\n\ndata: [DONE]\n\n';
    const enc = new TextEncoder();
    const body = new ReadableStream({
      start(c) {
        c.enqueue(enc.encode(text));
        c.close();
      },
    });
    const tokens: string[] = [];
    let done: { conversationId: string; messageId: string } | null = null;
    await readChatSse(body, {
      onToken: (t) => tokens.push(t),
      onDone: (p) => {
        if ("conversationId" in p) {
          done = { conversationId: p.conversationId, messageId: p.messageId };
        }
      },
      onInStreamError: () => {},
    });
    expect(tokens).toEqual(["hi"]);
    expect(done).toEqual({ conversationId: "c", messageId: "m" });
  });
});
