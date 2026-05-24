import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/lib/auth-constants";

/**
 * v2: session = short-lived JWT access token in `localStorage` + first-party
 * cookie (so Next.js `middleware` guards `/dashboard/*` without a server session),
 * PLUS a long-lived opaque refresh token in `localStorage` only.
 *
 * Refresh flow: Axios 401 interceptor reads the refresh token, calls
 * POST /auth/refresh, stores the new pair, and retries the original request.
 * The user never sees the expiry.
 */
export { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY };

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7d — align with REFRESH_TOKEN_EXPIRES

function setSessionCookie(token: string): void {
  if (typeof document === "undefined") return;
  const enc = encodeURIComponent(token);
  const isHttps =
    typeof location !== "undefined" && location.protocol === "https:";
  const secure = isHttps ? "; Secure" : "";
  document.cookie = `${ACCESS_TOKEN_KEY}=${enc}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

function clearSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

/** Read session cookie (used by `syncAccessTokenToCookie` / migration) */
function readTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie
    .split("; ")
    .find((r) => r.startsWith(`${ACCESS_TOKEN_KEY}=`));
  if (!m) return null;
  const raw = m.slice(ACCESS_TOKEN_KEY.length + 1);
  try {
    return raw ? decodeURIComponent(raw) : null;
  } catch {
    return raw || null;
  }
}

// ---------------------------------------------------------------------------
// Access token
// ---------------------------------------------------------------------------

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromStorage = window.localStorage.getItem(ACCESS_TOKEN_KEY);
    if (fromStorage) return fromStorage;
    return readTokenFromCookie();
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
    setSessionCookie(token);
  } catch {
    /* ignore */
  }
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    clearSessionCookie();
  } catch {
    /* ignore */
  }
}

/**
 * Copy localStorage token to cookie (and refresh cookie) so middleware can see
 * a session on the next navigation / full request.
 */
export function syncAccessTokenToCookie(): void {
  if (typeof window === "undefined") return;
  let token: string | null = null;
  try {
    token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return;
  }
  if (token) {
    setSessionCookie(token);
  }
}

// ---------------------------------------------------------------------------
// Refresh token — localStorage only (never in a cookie)
// ---------------------------------------------------------------------------

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearRefreshToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Clears both access and refresh tokens — call on full logout. */
export function clearAllTokens(): void {
  clearAccessToken();
  clearRefreshToken();
}
