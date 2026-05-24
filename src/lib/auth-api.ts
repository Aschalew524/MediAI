import { isAxiosError } from "axios";

import type { AuthTokens } from "@/lib/auth.types";
import { messageFromAxiosData } from "@/lib/auth.types";
import {
  setAccessToken,
  setRefreshToken,
  clearAllTokens,
} from "@/lib/auth-storage";
import api from "@/lib/axios";

function persistAuthAndReturn(data: AuthTokens): void {
  setAccessToken(data.accessToken);
  if (data.refreshToken) {
    setRefreshToken(data.refreshToken);
  }
}

export type LoginRequest = { email: string; password: string };
export type RegisterRequest = { email: string; password: string };
export type ForgotRequest = { email: string };
export type ResetRequest = { token: string; password: string };

export function userFacingAxiosError(
  err: unknown,
  fallback: string,
  options?: { resetPasswordContext?: boolean },
): string {
  if (!isAxiosError(err)) {
    return fallback;
  }
  if (!err.response) {
    const code = err.code;
    const base = String(err.config?.baseURL ?? "");
    if (code === "ERR_NETWORK" || code === "ECONNABORTED") {
      if (base.includes("localhost:4000")) {
        return (
          "Could not reach the API at localhost:4000. Either start MediAI_backend locally " +
          "(with PostgreSQL) or set NEXT_PUBLIC_API_URL=https://medi-ai-backend.vercel.app/api in .env and restart `npm run dev`."
        );
      }
      return (
        "Could not reach the API server (network or CORS). Confirm NEXT_PUBLIC_API_URL " +
        "is https://medi-ai-backend.vercel.app/api and redeploy the frontend; on the API project set " +
        "FRONTEND_URL=https://medi-ai-theta.vercel.app and redeploy the backend."
      );
    }
  }
  const status = err.response?.status;
  const path = String(err.config?.url ?? "");
  if (status === 401) {
    if (options?.resetPasswordContext || path.includes("reset-password")) {
      return messageFromAxiosData(err.response?.data) ?? "Invalid or expired reset link";
    }
    return "Invalid email or password";
  }
  if (status === 409) {
    return (
      messageFromAxiosData(err.response?.data) ??
        "An account with this email already exists"
    );
  }
  if (status === 400) {
    return messageFromAxiosData(err.response?.data) ?? "Please check your input";
  }
  if (status === 429) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (status === 503) {
    const serverMsg = messageFromAxiosData(err.response?.data);
    const base = String(err.config?.baseURL ?? "");
    if (serverMsg) {
      if (base.includes("medi-ai-backend.vercel.app")) {
        return `${serverMsg} (production API — set DATABASE_URL on the Vercel backend project and run prisma migrate deploy on that database.)`;
      }
      return serverMsg;
    }
    if (base.includes("localhost:4000")) {
      return (
        "Database is unavailable on your local API. Start PostgreSQL (docker compose in MediAI_backend) " +
        "or point NEXT_PUBLIC_API_URL to https://medi-ai-backend.vercel.app/api in MediAI/.env."
      );
    }
    return (
      "Database is unavailable on the API server. For the deployed backend, set DATABASE_URL in Vercel " +
      "(Neon pooled URL) and run `npx prisma migrate deploy` against that database."
    );
  }
  if (status === 422) {
    return (
      messageFromAxiosData(err.response?.data) ??
        "The request could not be sent. Check backend EMAIL_FROM and RESEND_API_KEY (or SMTP) in .env."
    );
  }
  if (status === 502) {
    return "The email service is temporarily unavailable. Please try again later.";
  }
  return messageFromAxiosData(err.response?.data) ?? fallback;
}

export async function postLogin(
  body: LoginRequest,
): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/auth/login", body);
  persistAuthAndReturn(data);
  return data;
}

export async function postRegister(
  body: RegisterRequest,
): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/auth/register", body);
  persistAuthAndReturn(data);
  return data;
}

export async function postForgotPassword(body: ForgotRequest): Promise<void> {
  await api.post("/auth/forgot-password", body);
}

export async function postResetPassword(body: ResetRequest): Promise<void> {
  await api.post("/auth/reset-password", body);
}

/**
 * Exchange a refresh token for a new access + refresh token pair.
 * Persists the new tokens automatically.
 */
export async function postRefresh(
  refreshToken: string,
): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/auth/refresh", {
    refreshToken,
  });
  persistAuthAndReturn(data);
  return data;
}

/**
 * Revoke the refresh token on the server and clear all local tokens.
 * Call this on explicit user logout.
 */
export async function postLogout(refreshToken: string): Promise<void> {
  try {
    await api.post("/auth/logout", { refreshToken });
  } finally {
    // Always clear local storage even if the request fails
    clearAllTokens();
  }
}
