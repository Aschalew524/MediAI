import { NextResponse } from "next/server";

import { getReplyForMode, type ChatMode } from "@/lib/chat-content";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    mode: ChatMode;
    message: string;
  };

  return NextResponse.json({
    reply: getReplyForMode(body.mode, body.message),
    author: body.mode === "personal" ? "AI Doctor" : "General Chat",
  });
}
