import axios, { isAxiosError } from "axios";

import { clearAccessToken, getAccessToken } from "@/lib/auth-storage";
import { getApiBaseUrl } from "@/lib/api-origin";
import { redirectToSignInWithCurrentPath } from "@/lib/redirect-signin";

const baseURL = getApiBaseUrl();

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

const AUTH_CLEARED = "mediai:auth-cleared";

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!isAxiosError(error)) {
      return Promise.reject(error);
    }
    const status = error.response?.status;
    const path = String(error.config?.url ?? error.config?.baseURL ?? "");
    // JWT-only chat / history: go to signin (same as fetch stream handlers)
    const isAuthChatPath =
      path.includes("/chat/personal") || path.includes("/chat/conversations");
    if (status === 401 && isAuthChatPath) {
      const had = getAccessToken();
      if (had) {
        clearAccessToken();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(AUTH_CLEARED));
        }
      }
      if (typeof window !== "undefined") {
        redirectToSignInWithCurrentPath();
      }
      return Promise.reject(error);
    }
    // Current user routes (clear expired session in browser)
    const isMe =
      path.includes("auth/me") ||
      path.includes("/me/") ||
      path.includes("/onboarding/complete");
    if (status === 401 && isMe) {
      const had = getAccessToken();
      if (had) {
        clearAccessToken();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(AUTH_CLEARED));
        }
      }
    }
    return Promise.reject(error);
  },
);

export function subscribeAuthCleared(fn: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(AUTH_CLEARED, fn);
  return () => window.removeEventListener(AUTH_CLEARED, fn);
}

export default api;
