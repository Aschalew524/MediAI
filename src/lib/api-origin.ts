/** Base path for all Nest routes (e.g. http://localhost:4000/api) */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
}

/** API origin without trailing /api — used for Google OAuth full-URL redirect */
export function getApiOrigin(): string {
  const base = getApiBaseUrl().replace(/\/$/, "");
  if (base.endsWith("/api")) {
    return base.slice(0, -4) || "http://localhost:4000";
  }
  return base;
}
