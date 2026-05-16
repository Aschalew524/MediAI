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
import api from "@/lib/axios";
import {
  getGoogleOAuthStartUrl,
  isGoogleSignInUiEnabled,
  oauthCallbackErrorMessage,
} from "@/lib/auth-oauth";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const [formError, setFormError] = useState<string | null>(null);
  const [dbPreflightError, setDbPreflightError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showGoogle = isGoogleSignInUiEnabled();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api.get("/health/database");
        if (!cancelled) setDbPreflightError(null);
      } catch (err) {
        if (!cancelled) {
          setDbPreflightError(
            userFacingAxiosError(
              err,
              "Database is unavailable. Ensure PostgreSQL is running and DATABASE_URL user/password match your server (e.g. password for role `medi_ai`).",
            ),
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      const safeFrom =
        from &&
        !from.startsWith("//") &&
        (from.startsWith("/dashboard") || from.startsWith("/admin"))
          ? from
          : null;
      if (session.user.appRole === "admin") {
        router.push(safeFrom?.startsWith("/admin") ? safeFrom : "/admin");
      } else {
        router.push(safeFrom ?? "/dashboard");
      }
    } catch (err) {
      setFormError(
        userFacingAxiosError(err, "We could not sign you in. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {from ? (
        <p className="mb-4 w-full text-center text-sm text-muted-foreground">
          Sign in to continue to the app.
        </p>
      ) : null}
      {dbPreflightError || formError ? (
        <AuthFormErrorAlert message={dbPreflightError ?? formError ?? ""} />
      ) : null}

      <form className="w-full space-y-4" onSubmit={handleSubmit}>
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

      {showGoogle ? (
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
