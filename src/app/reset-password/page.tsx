"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";

import {
  AuthFormErrorAlert,
  AuthPageShell,
  AuthPrimaryButton,
  IconInput,
  MediAIWordmark,
} from "@/components/auth/shared";
import { postResetPassword, userFacingAxiosError } from "@/lib/auth-api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setFormError(null);
  }, [token]);

  if (!token) {
    return (
      <p
        className="mb-6 w-full text-center text-sm text-destructive"
        role="alert"
      >
        This password reset link is missing a token. Request a new link from the
        forgot password page.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirmPassword") ?? "");
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setFormError("Passwords do not match.");
      return;
    }
    if (!token) {
      return;
    }
    setIsSubmitting(true);
    try {
      await postResetPassword({ token, password });
      setSuccess(true);
    } catch (err) {
      setFormError(
        userFacingAxiosError(
          err,
          "We could not reset your password. Please try again or request a new link.",
          { resetPasswordContext: true },
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="w-full space-y-6 text-center">
        <p
          className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-3 text-sm text-foreground"
          role="status"
        >
          Your password has been updated. You can sign in with your new password.
        </p>
        <Link
          href="/signin"
          className="text-sm font-semibold text-[#5B86F7] hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="w-full space-y-4" onSubmit={handleSubmit}>
      {formError ? <AuthFormErrorAlert message={formError} /> : null}
      <IconInput
        icon={<Lock className="size-[18px]" />}
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="New password (min. 8 characters)"
        minLength={8}
        maxLength={128}
        required
      />
      <IconInput
        icon={<Lock className="size-[18px]" />}
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="Confirm new password"
        minLength={8}
        maxLength={128}
        required
      />
      <AuthPrimaryButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Set new password"}
      </AuthPrimaryButton>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthPageShell>
      <MediAIWordmark className="mb-6" />
      <h1 className="mb-8 w-full text-center text-2xl font-bold text-foreground">
        Reset your password
      </h1>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading reset form…</p>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthPageShell>
  );
}
