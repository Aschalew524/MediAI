import { NextResponse } from "next/server";

import {
  chatHistoryItems,
  doctorTypeOptions,
  seededPersonalConversation,
} from "@/lib/chat-content";

export async function GET() {
  const ragEnabled =
    process.env.NEXT_PUBLIC_RAG_ENABLED === "1" ||
    process.env.NEXT_PUBLIC_RAG_ENABLED === "true";
  return NextResponse.json({
    doctorTypeOptions,
    chatHistoryItems,
    seededPersonalConversation,
    ragEnabled,
  });
}
