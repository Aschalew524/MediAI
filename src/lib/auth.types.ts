export type AuthUser = {
  id: string;
  email: string;
  /** Present from `/auth/me` when backend exposes role (required for blog admin gate). */
  appRole?: "user" | "admin";
};

export type AuthTokens = {
  accessToken: string;
  /** Opaque long-lived token. Use POST /auth/refresh to get a new access token. */
  refreshToken: string;
  user: AuthUser;
};

/**
 * Returns a user-facing string from a Nest validation error (400) when possible.
 */
export function messageFromAxiosData(data: unknown): string | null {
  if (data == null) return null;
  if (typeof data === "string") {
    const t = data.trim();
    if (!t) return null;
    if (t.startsWith("{")) {
      try {
        return messageFromAxiosData(JSON.parse(t) as unknown);
      } catch {
        return t;
      }
    }
    return t;
  }
  if (typeof data !== "object") return null;
  const o = data as {
    message?: string | string[];
    statusCode?: number;
  };
  if (typeof o.message === "string" && o.message) return o.message;
  if (Array.isArray(o.message) && o.message.length) return o.message[0] ?? null;
  const asRecord = o as { message: unknown; errors?: object };
  if (asRecord.message && Array.isArray(asRecord.message) && asRecord.message[0]) {
    return String(asRecord.message[0]);
  }
  return null;
}
