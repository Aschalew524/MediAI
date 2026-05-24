/** Deployed Nest API (Vercel). */
export const PRODUCTION_API_BASE = "https://medi-ai-backend.vercel.app/api";

/** Local Nest (`npm start` in MediAI_backend, default port 4000). */
export const LOCAL_API_BASE = "http://localhost:4000/api";

/** Same-origin path on the Next app — proxied to Nest (see `next.config.ts` rewrites). */
export const NEST_PROXY_PREFIX = "/nest";

function normalizeApiBase(url: string): string {
  return url.replace(/\/$/, "");
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}

/** Optional: set `NEXT_PUBLIC_USE_LOCAL_API=true` in `.env.local` to force local backend. */
export function isLocalApiDevEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_USE_LOCAL_API?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

function readEnvApiUrl(): string | null {
  if (isLocalApiDevEnabled()) {
    return LOCAL_API_BASE;
  }
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return null;
  const normalized = normalizeApiBase(raw);
  if (
    typeof window !== "undefined" &&
    normalized.includes("medi-ai-theta.vercel.app") &&
    !normalized.includes("medi-ai-backend")
  ) {
    console.error(
      "[MediAI] NEXT_PUBLIC_API_URL must be the API host " +
        "(https://medi-ai-backend.vercel.app/api), not the frontend URL.",
    );
  }
  return normalized;
}

/** True when the app is configured to talk to a local Nest instance. */
export function isUsingLocalApi(): boolean {
  const url = readEnvApiUrl() ?? "";
  return (
    isLocalApiDevEnabled() ||
    url.includes("localhost") ||
    url.includes("127.0.0.1")
  );
}

function resolveDirectApiUrl(): string {
  const fromEnv = readEnvApiUrl();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "development") {
    return LOCAL_API_BASE;
  }
  return PRODUCTION_API_BASE;
}

/**
 * Direct Nest API URL (OAuth redirects + Next.js `/nest` rewrite target).
 */
export function getApiDirectBaseUrl(): string {
  return resolveDirectApiUrl();
}

/** Nest origin without `/api` — Google OAuth redirects. */
export function getApiOrigin(): string {
  const base = getApiDirectBaseUrl();
  if (base.endsWith("/api")) {
    return base.slice(0, -4) || "http://localhost:4000";
  }
  return base;
}

/**
 * Axios `baseURL`.
 *
 * - **Production site** (`*.vercel.app`): same-origin `/nest` proxy (no CORS).
 * - **Local Next** (`localhost:3000`): direct API URL (local or production per env).
 */
export function getApiBaseUrl(): string {
  const direct = resolveDirectApiUrl();

  if (typeof window !== "undefined") {
    if (!isLocalHostname(window.location.hostname)) {
      return `${window.location.origin}${NEST_PROXY_PREFIX}`;
    }
    return direct;
  }

  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    return direct;
  }

  return direct;
}
