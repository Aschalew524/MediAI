/** Default page size for GET personal messages; must stay within backend max (e.g. 100). */
export const CHAT_MESSAGE_PAGE_SIZE = 40;

export const CHAT_LIST_PAGE_SIZE = 20;

/** Set `NEXT_PUBLIC_CHAT_STREAM=1` to use SSE for assistant replies. */
export function isChatStreamEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CHAT_STREAM === "1";
}
