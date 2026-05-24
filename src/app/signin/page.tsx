"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { Suspense } from "react";

import {
  AuthFormErrorAlert,
  AuthOutlineButton,
  AuthPageShell,
  AuthPrimaryButton,
  GoogleMark,
  IconInput,
  LegalDisclaimer,
  MediAIWordmark,
  OrDivider,
} from "@/components/auth/shared";
import { postLogin, userFacingAxiosError } from "@/lib/auth-api";
import { resolvePostLoginDestination } from "@/lib/auth-redirect";
import {
  clearAccessToken,
  getAccessToken,
} from "@/lib/auth-storage";
import api from "@/lib/axios";
import type { AuthUser } from "@/lib/auth.types";
import {
  getGoogleOAuthStartUrl,
  isGoogleSignInUiEnabled,
  oauthCallbackErrorMessage,
} from "@/lib/auth-oauth";
import { cn } from "@/lib/utils";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingSession, setExistingSession] = useState<AuthUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const showGoogle = isGoogleSignInUiEnabled();

  const safeFrom =
    from &&
    !from.startsWith("//") &&
    (from.startsWith("/dashboard") || from.startsWith("/admin"))
      ? from
      : null;

  useEffect(() => {
    if (searchParams.get("fresh") === "1") {
      clearAccessToken();
      setExistingSession(null);
      setCheckingSession(false);
      return;
    }

    let cancelled = false;
    (async () => {
      if (!getAccessToken()) {
        if (!cancelled) {
          setExistingSession(null);
          setCheckingSession(false);
        }
        return;
      }
      try {
        const { data } = await api.get<AuthUser>("/auth/me");
        if (!cancelled) setExistingSession(data);
      } catch {
        clearAccessToken();
        if (!cancelled) setExistingSession(null);
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    const err = searchParams.get("error");
    if (!err) return;
    setFormError(oauthCallbackErrorMessage(err));
    const next = new URLSearchParams();
    if (
      from &&
      !from.startsWith("//") &&
      (from.startsWith("/dashboard") || from.startsWith("/admin"))
    ) {
      next.set("from", from);
    }
    const qs = next.toString();
    router.replace(qs ? `/signin?${qs}` : "/signin", { scroll: false });
  }, [router, searchParams, from]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    try {
      const session = await postLogin({ email, password });
      const destination = await resolvePostLoginDestination({
        appRole: session.user.appRole,
        from: safeFrom,
      });
      router.push(destination);
    } catch (err) {
      setFormError(
        userFacingAxiosError(err, "We could not sign you in. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function continueExistingSession() {
    setFormError(null);
    setIsSubmitting(true);
    try {
      const destination = await resolvePostLoginDestination({
        appRole: existingSession?.appRole,
        from: safeFrom,
      });
      router.push(destination);
    } catch {
      setFormError("We could not open your dashboard. Please sign in again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function useDifferentAccount() {
    clearAccessToken();
    setExistingSession(null);
    setFormError(null);
  }

  return (
    <>
      {from ? (
        <p className="mb-4 w-full text-center text-sm text-muted-foreground">
          Sign in to continue to the app.
        </p>
      ) : null}
      {formError ? (
        <AuthFormErrorAlert message={formError} />
      ) : null}

      {checkingSession ? (
        <p className="mb-4 text-center text-sm text-muted-foreground">
          Checking session…
        </p>
      ) : existingSession ? (
        <div className="mb-4 w-full space-y-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-4 text-center">
          <p className="text-sm text-foreground">
            You are already signed in as{" "}
            <span className="font-semibold">{existingSession.email}</span>.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <AuthPrimaryButton
              type="button"
              disabled={isSubmitting}
              onClick={() => void continueExistingSession()}
            >
              Continue to dashboard
            </AuthPrimaryButton>
            <AuthOutlineButton type="button" onClick={useDifferentAccount}>
              Use a different account
            </AuthOutlineButton>
          </div>
        </div>
      ) : null}

      <form
        className={cn(
          "w-full space-y-4",
          existingSession && !checkingSession ? "hidden" : "",
        )}
        onSubmit={handleSubmit}
      >
        <IconInput
          icon={<Mail className="size-[18px]" />}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          required
        />
        <div className="space-y-2">
          <IconInput
            icon={<Lock className="size-[18px]" />}
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[#5B86F7] hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </div>
        <AuthPrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign In"}
        </AuthPrimaryButton>
      </form>

      {showGoogle && !existingSession && !checkingSession ? (
        <>
          <OrDivider />
          <AuthOutlineButton
            type="button"
            aria-label="Continue with Google"
            onClick={() => {
              window.location.assign(getGoogleOAuthStartUrl());
            }}
          >
            <GoogleMark />
            Continue with Google
          </AuthOutlineButton>
        </>
      ) : (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Google sign-in is disabled in this build.
        </p>
      )}
    </>
  );
}

export default function SignInPage() {
  return (
    <AuthPageShell>
      <MediAIWordmark className="mb-2" />
      <h1 className="mb-8 text-2xl font-bold text-foreground">Welcome Back!</h1>

      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading…</p>
        }
      >
        <SignInForm />
      </Suspense>

      <p className="mt-6 text-center text-sm text-foreground/80">
        Don&apos;t have account?{" "}
        <Link href="/signup" className="font-medium text-[#5B86F7] hover:underline">
          Sign Up
        </Link>
      </p>

      <LegalDisclaimer verb="signing in" />
    </AuthPageShell>
  );
}
