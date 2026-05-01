"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { Suspense } from "react";

import {
  AuthPageShell,
  AuthPrimaryButton,
  IconInput,
  LegalDisclaimer,
  MediAIWordmark,
} from "@/components/auth/shared";
import { postLogin, userFacingAxiosError } from "@/lib/auth-api";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const e = searchParams.get("error");
    if (e) {
      setFormError("Sign-in could not be completed. Please try again.");
      router.replace("/signin", { scroll: false });
    }
  }, [router, searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    try {
      await postLogin({ email, password });
      if (
        from &&
        !from.startsWith("//") &&
        (from.startsWith("/dashboard") || from.startsWith("/admin"))
      ) {
        router.push(from);
      } else {
        router.push("/dashboard");
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
      {formError ? (
        <p
          role="alert"
          className="mb-4 w-full rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </p>
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
