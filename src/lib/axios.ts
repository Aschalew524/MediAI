import axios, { isAxiosError, type InternalAxiosRequestConfig } from "axios";

import {
  clearAllTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/lib/auth-storage";
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

// Tracks whether a refresh call is already in-flight so concurrent 401s
// don't each fire their own refresh request.
let isRefreshing = false;
let pendingRetries: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function onRefreshSuccess(newToken: string) {
  pendingRetries.forEach(({ resolve }) => resolve(newToken));
  pendingRetries = [];
}

function onRefreshFailure(err: unknown) {
  pendingRetries.forEach(({ reject }) => reject(err));
  pendingRetries = [];
}

// ---------------------------------------------------------------------------
// Request interceptor — attach access token
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — silent refresh on 401
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!isAxiosError(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const originalConfig = error.config as InternalAxiosRequestConfig & {
      _retried?: boolean;
    };
    const path = String(originalConfig?.url ?? originalConfig?.baseURL ?? "");

    // ── Do NOT retry the refresh endpoint itself (avoid infinite loop) ──────
    const isRefreshEndpoint = path.includes("/auth/refresh");
    const isLogoutEndpoint = path.includes("/auth/logout");

    // ── Silent refresh on any 401 (except refresh/logout routes) ───────────
    if (
      status === 401 &&
      !originalConfig._retried &&
      !isRefreshEndpoint &&
      !isLogoutEndpoint
    ) {
      const storedRefreshToken = getRefreshToken();

      if (!storedRefreshToken) {
        // No refresh token — hard logout
        clearAllTokens();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(AUTH_CLEARED));
          redirectToSignInWithCurrentPath();
        }
        return Promise.reject(error);
      }

      originalConfig._retried = true;

      if (isRefreshing) {
        // Another request is already refreshing — queue this one
        return new Promise<string>((resolve, reject) => {
          pendingRetries.push({ resolve, reject });
        })
          .then((newToken) => {
            originalConfig.headers.Authorization = `Bearer ${newToken}`;
            return api(originalConfig);
          })
          .catch(() => Promise.reject(error));
      }

      isRefreshing = true;

      try {
        // Call refresh directly (not via `api` to avoid interceptor loops)
        const { data } = await axios.post<{
          accessToken: string;
          refreshToken: string;
        }>(`${baseURL}/auth/refresh`, { refreshToken: storedRefreshToken });

        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);

        onRefreshSuccess(data.accessToken);

        // Retry the original request with the new access token
        originalConfig.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalConfig);
      } catch (refreshErr) {
        onRefreshFailure(refreshErr);
        clearAllTokens();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(AUTH_CLEARED));
          redirectToSignInWithCurrentPath();
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // ── Legacy hard-logout paths (chat streams that can't be retried) ───────
    const isAuthChatPath =
      path.includes("/chat/personal") || path.includes("/chat/conversations");
    if (status === 401 && isAuthChatPath) {
      clearAllTokens();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_CLEARED));
        redirectToSignInWithCurrentPath();
      }
      return Promise.reject(error);
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
