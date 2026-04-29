import { ACCESS_TOKEN_KEY } from "@/lib/auth-constants";

/**
 * v1: session = JWT in `localStorage` (axios) + same value in a first-party cookie
 * (so Next.js `middleware` can require auth for `/dashboard/*` without a server session).
 * Google OAuth and httpOnly sessions are deferred.
 */
export { ACCESS_TOKEN_KEY };

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7d — align with typical JWT_EXP

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
