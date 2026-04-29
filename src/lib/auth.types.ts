export type AuthUser = {
  id: string;
  email: string;
};

export type AuthTokens = {
  accessToken: string;
  user: AuthUser;
};

/**
 * Returns a user-facing string from a Nest validation error (400) when possible.
 */
export function messageFromAxiosData(data: unknown): string | null {
  if (data == null || typeof data !== "object") return null;
  const o = data as {
    message?: string | string[];
  };
  if (typeof o.message === "string" && o.message) return o.message;
  if (Array.isArray(o.message) && o.message.length) return o.message[0] ?? null;
  const asRecord = o as { message: unknown; errors?: object };
  if (asRecord.message && Array.isArray(asRecord.message) && asRecord.message[0]) {
    return String(asRecord.message[0]);
  }
  return null;
}
