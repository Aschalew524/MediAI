import { isAxiosError } from "axios";

function nestMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const msg = (data as { message?: string | string[] }).message;
  if (typeof msg === "string" && msg.trim()) return msg.trim();
  if (Array.isArray(msg) && typeof msg[0] === "string" && msg[0].trim()) {
    return msg[0].trim();
  }
  return undefined;
}

/**
 * Human-readable copy for common HTTP failures (Nest/axios).
 */
export function getFriendlyAxiosMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!isAxiosError(error)) {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  }

  const status = error.response?.status;
  const server = nestMessage(error.response?.data);

  if (status === 400) {
    return server ?? "Invalid request. Check your input and try again.";
  }
  if (status === 404) {
    return server ?? "Nothing was found for this request.";
  }
  if (status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }
  if (status != null && status >= 500) {
    return server ?? "The server had a problem. Please try again later.";
  }

  if (error.response == null) {
    return "Could not reach the server. Check your connection and try again.";
  }

  return server ?? fallback;
}
