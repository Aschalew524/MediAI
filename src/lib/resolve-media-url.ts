import { getApiBaseUrl } from "@/lib/api-origin";

/**
 * Turn stored media paths into browser-loadable URLs.
 *
 * - `https://…`, `data:…` — returned unchanged
 * - `/files/…` — Nest API (profile photos uploaded by doctors)
 * - other `/…` paths — treated as Next.js `/public` assets
 */
export function resolveMediaUrl(pathOrUrl: string | undefined | null): string {
  const raw = pathOrUrl?.trim() ?? "";
  if (!raw) return "";
  if (/^(https?:|data:)/i.test(raw)) return raw;
  if (raw.startsWith("/files/")) {
    const base = getApiBaseUrl().replace(/\/$/, "");
    return `${base}${raw}`;
  }
  return raw;
}
