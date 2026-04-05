import { NextResponse } from "next/server";

import {
  chatHistoryItems,
  doctorTypeOptions,
  seededPersonalConversation,
} from "@/lib/chat-content";

export async function GET() {
  return NextResponse.json({
    doctorTypeOptions,
    chatHistoryItems,
    seededPersonalConversation,
  });
}
