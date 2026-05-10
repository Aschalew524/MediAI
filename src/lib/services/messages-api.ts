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

/**
 * A row in the calling user's "Messages" inbox. Both patient- and doctor-side
 * inboxes use this same shape — patients render the doctor fields, doctors
 * render the patient fields.
 */
export type ApiThreadSummary = {
  threadId: string;
  doctorUserId: string;
  doctorName: string;
  doctorSpecialty: string | null;
  patientUserId: string;
  patientName: string;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  lastMessageSender: "doctor" | "patient" | null;
  /** Inbound messages addressed to the caller that they haven't read yet. */
  unreadCount: number;
};

export type ApiThreadList = {
  items: ApiThreadSummary[];
};

/** Aggregated unread count across every thread the caller participates in. */
export type ApiUnreadCount = {
  count: number;
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

/**
 * Inbox for the calling user. Returns threads where the caller is the patient
 * (for personal accounts) or the doctor (for professional accounts). Empty
 * threads with no messages exchanged are filtered out by the backend.
 */
export async function listMyThreads(): Promise<ApiThreadList> {
  const { data } = await api.get<ApiThreadList>("/me/messages/threads");
  return data;
}

/**
 * Total inbound messages that haven't been read yet by the caller, across
 * every thread. Powers the navbar message-icon badge.
 */
export async function getMyUnreadCount(): Promise<ApiUnreadCount> {
  const { data } = await api.get<ApiUnreadCount>("/me/messages/unread-count");
  return data;
}

/**
 * Fetch one thread's messages. Backend marks doctor → patient messages as read
 * as a side-effect of this call, so unread counts reset after navigation. We
 * also fire the global `mediai:messages-changed` event so the navbar badge
 * refreshes immediately instead of waiting for its next poll.
 */
export async function getMyThread(
  threadId: string,
  limit?: number,
): Promise<ApiThreadDetail> {
  const { data } = await api.get<ApiThreadDetail>(
    `/me/messages/threads/${encodeURIComponent(threadId)}`,
    { params: clean({ limit }) },
  );
  notifyMessagesChanged();
  return data;
}

/**
 * Dispatched after any call that mutates the caller's read-state on the
 * backend. The navbar's `useUnreadMessages` hook listens for this on
 * `window` to clear its badge without waiting for the 30s poll.
 */
function notifyMessagesChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("mediai:messages-changed"));
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
