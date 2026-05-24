/** Real Nest host (OAuth + Next.js rewrite target). */
export const PRODUCTION_API_BASE = "https://medi-ai-backend.vercel.app/api";

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

function readEnvApiUrl(): string | null {
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

/**
 * Direct Nest API URL (used for Google OAuth and as the rewrite destination).
 */
export function getApiDirectBaseUrl(): string {
  return readEnvApiUrl() ?? PRODUCTION_API_BASE;
}

/** Nest origin without `/api` — Google OAuth redirects. */
export function getApiOrigin(): string {
  const base = getApiDirectBaseUrl();
  if (base.endsWith("/api")) {
    return base.slice(0, -4) || "https://medi-ai-backend.vercel.app";
  }
  return base;
}

/**
 * Axios `baseURL`.
 *
 * - **Production browser** (`*.vercel.app`, etc.): same-origin `/nest` proxy → no CORS.
 * - **Local dev**: `NEXT_PUBLIC_API_URL` or `http://localhost:4000/api`.
 * - **SSR on Vercel**: direct backend URL (server-side fetch, no CORS).
 */
export function getApiBaseUrl(): string {
  const direct = readEnvApiUrl();

  if (typeof window !== "undefined") {
    if (!isLocalHostname(window.location.hostname)) {
      return `${window.location.origin}${NEST_PROXY_PREFIX}`;
    }
    return direct ?? "http://localhost:4000/api";
  }

  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    return direct ?? PRODUCTION_API_BASE;
  }

  return direct ?? "http://localhost:4000/api";
}
