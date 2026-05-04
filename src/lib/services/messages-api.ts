import api from "@/lib/axios";

/** Single message inside a doctor↔patient thread (patient perspective). */
export type ApiThreadMessage = {
  id: string;
  threadId: string;
  sender: "doctor" | "patient";
  senderUserId: string;
  /** True when the calling patient authored this message. */
  mine: boolean;
  body: string;
  createdAt: string;
  readAt: string | null;
};

/** A single thread the patient is participating in. */
export type ApiThreadDetail = {
  threadId: string;
  doctorUserId: string;
  doctorName: string;
  doctorSpecialty: string | null;
  messages: ApiThreadMessage[];
};

/** A row in the patient's "Messages" inbox. */
export type ApiThreadSummary = {
  threadId: string;
  doctorUserId: string;
  doctorName: string;
  doctorSpecialty: string | null;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  lastMessageSender: "doctor" | "patient" | null;
  unreadCount: number;
};

export type ApiThreadList = {
  items: ApiThreadSummary[];
};

function clean(params: Record<string, unknown>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = v as string | number;
  }
  return out;
}

/** Inbox: every doctor↔patient thread the calling patient participates in. */
export async function listMyThreads(): Promise<ApiThreadList> {
  const { data } = await api.get<ApiThreadList>("/me/messages/threads");
  return data;
}

/**
 * Fetch one thread's messages. Backend marks doctor → patient messages as read
 * as a side-effect of this call, so unread counts reset after navigation.
 */
export async function getMyThread(
  threadId: string,
  limit?: number,
): Promise<ApiThreadDetail> {
  const { data } = await api.get<ApiThreadDetail>(
    `/me/messages/threads/${encodeURIComponent(threadId)}`,
    { params: clean({ limit }) },
  );
  return data;
}

/** Patient → doctor reply in an existing thread. */
export async function sendMyMessage(
  threadId: string,
  body: string,
): Promise<ApiThreadMessage> {
  const { data } = await api.post<ApiThreadMessage>(
    `/me/messages/threads/${encodeURIComponent(threadId)}`,
    { body },
  );
  return data;
}
