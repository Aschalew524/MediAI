import { isAxiosError } from "axios";

import type { AuthTokens } from "@/lib/auth.types";
import { messageFromAxiosData } from "@/lib/auth.types";
import { setAccessToken } from "@/lib/auth-storage";
import api from "@/lib/axios";

function persistAuthAndReturn(data: AuthTokens): void {
  setAccessToken(data.accessToken);
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
    return (
      messageFromAxiosData(err.response?.data) ??
        "Database is unavailable. Ensure PostgreSQL is running and DATABASE_URL user/password match your server (e.g. password for role `medi_ai`)."
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
