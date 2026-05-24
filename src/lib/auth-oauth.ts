import { getApiDirectBaseUrl } from "@/lib/api-origin";

/**
 * Full browser navigation to Nest — starts Google OAuth (`302` → Google).
 * Must use the real API host (not the `/nest` same-origin proxy).
 */
export function getGoogleOAuthStartUrl(): string {
  const base = getApiDirectBaseUrl().replace(/\/$/, "");
  return `${base}/auth/google`;
}

/**
 * When `NEXT_PUBLIC_GOOGLE_SIGNIN` is exactly `"false"`, hide the Google button.
 * Otherwise show it (Nest still returns 503 if OAuth env is missing).
 */
export function isGoogleSignInUiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_SIGNIN !== "false";
}

/** Map Nest / Google redirect `error` query values to user-facing copy */
export function oauthCallbackErrorMessage(code: string): string {
  const c = code.trim().toLowerCase();
  switch (c) {
    case "oauth_failed":
      return "Google sign-in failed. Please try again or use email and password.";
    case "missing_code":
      return "Google did not return an authorization code. Please try again.";
    case "access_denied":
      return "Google sign-in was cancelled.";
    default:
      if (c.startsWith("access_")) {
        return "Google sign-in was cancelled or could not complete.";
      }
      return "Sign-in could not be completed. Please try again or use email and password.";
  }
}
