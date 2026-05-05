import { isAxiosError } from "axios";

import { getApiBaseUrl } from "@/lib/api-origin";
import { clearAccessToken, getAccessToken } from "@/lib/auth-storage";
import api from "@/lib/axios";
import { CHAT_MESSAGE_PAGE_SIZE } from "@/lib/chat-constants";
import { readChatSse, type SseDoneGeneral, type SseDonePersonal, type SseInStreamError } from "@/lib/chat-sse";
import { redirectToSignInWithCurrentPath } from "@/lib/redirect-signin";

export type ChatApiCitation = {
  source: string;
  excerpt: string;
};

export type PostPersonalMessageResponse = {
  reply: string;
  conversationId: string;
  messageId: string;
  citations?: ChatApiCitation[];
};

export type PostGeneralMessageResponse = {
  reply: string;
  messageId: string;
  citations?: ChatApiCitation[];
};

export type ConversationListItem = {
  id: string;
  kind: "personal" | "general";
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string;
};

export type ListConversationsResponse = {
  items: ConversationListItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type StoredMessageRole = "user" | "assistant" | "system";

export type PersonalMessageItem = {
  id: string;
  role: StoredMessageRole;
  content: string;
  createdAt: string;
};

export type ListPersonalMessagesResponse = {
  items: PersonalMessageItem[];
  hasMore: boolean;
};

export type PostMessageInput = {
  message: string;
  conversationId?: string;
};

export type PostGeneralMessageInput = {
  message: string;
  /**
   * Client-owned id for general multi-turn. The Nest response does not echo it;
   * send the same value on every turn in a thread (e.g. sessionStorage or crypto.randomUUID per "New chat").
   */
  sessionId?: string;
};

export async function postPersonalMessage(
  input: PostMessageInput,
): Promise<PostPersonalMessageResponse> {
  const { data } = await api.post<PostPersonalMessageResponse>("/chat/personal/messages", {
    message: input.message,
    ...(input.conversationId ? { conversationId: input.conversationId } : {}),
  });
  return data;
}

export async function postGeneralMessage(
  input: PostGeneralMessageInput,
): Promise<PostGeneralMessageResponse> {
  const { data } = await api.post<PostGeneralMessageResponse>("/chat/general/messages", {
    message: input.message,
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
  });
  return data;
}

export async function listPersonalConversations(
  page = 1,
  pageSize = 20,
): Promise<ListConversationsResponse> {
  const { data } = await api.get<ListConversationsResponse>("/chat/conversations", {
    params: { page, pageSize },
  });
  return data;
}

export async function getPersonalMessages(
  conversationId: string,
  options?: { limit?: number; before?: string },
): Promise<ListPersonalMessagesResponse> {
  const { data } = await api.get<ListPersonalMessagesResponse>(
    `/chat/conversations/${conversationId}/messages`,
    {
      params: {
        limit: options?.limit ?? CHAT_MESSAGE_PAGE_SIZE,
        ...(options?.before ? { before: options.before } : {}),
      },
    },
  );
  return data;
}

export function isChatAuthError(e: unknown): boolean {
  return isAxiosError(e) && e.response?.status === 401;
}

export function isChatRateLimited(e: unknown): boolean {
  return isAxiosError(e) && e.response?.status === 429;
}

export function getChatErrorMessage(e: unknown): string | undefined {
  if (!isAxiosError(e)) {
    return (e as Error)?.message;
  }
  const data = e.response?.data as { message?: string | string[] } | undefined;
  if (data && "message" in data && data.message) {
    return Array.isArray(data.message) ? data.message[0] : data.message;
  }
  return e.message;
}

const AUTH_CLEARED = "mediai:auth-cleared";

function clearSessionAndNotify(): void {
  if (getAccessToken()) {
    clearAccessToken();
    window.dispatchEvent(new Event(AUTH_CLEARED));
  }
}

function buildPersonalStreamBody(input: PostMessageInput): string {
  return JSON.stringify({
    message: input.message,
    ...(input.conversationId ? { conversationId: input.conversationId } : {}),
  });
}

function buildGeneralStreamBody(input: PostGeneralMessageInput): string {
  return JSON.stringify({
    message: input.message,
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
  });
}

/**
 * `POST /chat/personal/messages/stream` (SSE). Requires a JWT; 401 triggers redirect to signin.
 */
export async function streamPersonalMessage(
  input: PostMessageInput,
  handlers: {
    onToken: (t: string) => void;
    onDone: (p: SseDonePersonal) => void;
    onInStreamError: (p: SseInStreamError) => void;
  },
  options?: { signal?: AbortSignal },
): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    redirectToSignInWithCurrentPath();
    throw new Error("Not signed in");
  }
  const res = await fetch(
    `${getApiBaseUrl().replace(/\/$/, "")}/chat/personal/messages/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        Authorization: `Bearer ${token}`,
      },
      body: buildPersonalStreamBody(input),
      signal: options?.signal,
    },
  );
  if (res.status === 401) {
    clearSessionAndNotify();
    redirectToSignInWithCurrentPath();
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    throw new Error(res.statusText || `HTTP ${res.status}`);
  }
  await readChatSse(
    res.body,
    {
      onToken: handlers.onToken,
      onDone: (p) => {
        if ("conversationId" in p) {
          handlers.onDone(p);
        }
      },
      onInStreamError: handlers.onInStreamError,
    },
    options?.signal,
  );
}

/**
 * `POST /chat/general/messages/stream` (SSE). Bearer optional; anonymous allowed.
 */
export async function streamGeneralMessage(
  input: PostGeneralMessageInput,
  handlers: {
    onToken: (t: string) => void;
    onDone: (p: SseDoneGeneral) => void;
    onInStreamError: (p: SseInStreamError) => void;
  },
  options?: { signal?: AbortSignal },
): Promise<void> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(
    `${getApiBaseUrl().replace(/\/$/, "")}/chat/general/messages/stream`,
    {
      method: "POST",
      headers,
      body: buildGeneralStreamBody(input),
      signal: options?.signal,
    },
  );
  if (res.status === 401) {
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    throw new Error(res.statusText || `HTTP ${res.status}`);
  }
  await readChatSse(
    res.body,
    {
      onToken: handlers.onToken,
      onDone: (p) => {
        if ("reply" in p) {
          handlers.onDone(p);
        }
      },
      onInStreamError: handlers.onInStreamError,
    },
    options?.signal,
  );
}
