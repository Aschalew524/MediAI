"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Mail } from "lucide-react";

import {
  AuthPageShell,
  AuthPrimaryButton,
  IconInput,
  LegalDisclaimer,
  MediAIWordmark,
} from "@/components/auth/shared";
import { postRegister, userFacingAxiosError } from "@/lib/auth-api";

export default function SignUpEmailPage() {
  const router = useRouter();
  const [mismatch, setMismatch] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setMismatch(false);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const confirmPassword = String(fd.get("confirmPassword") ?? "");
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMismatch(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await postRegister({ email, password });
      router.push("/onboarding");
    } catch (err) {
      setFormError(
        userFacingAxiosError(err, "We could not create your account. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageShell>
      <MediAIWordmark className="mb-6" />

      <div className="mb-6 flex w-full items-center gap-3">
        <Link
          href="/signup"
          aria-label="Back to sign up options"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-white/80"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
      </div>

      {mismatch ? (
        <p
          role="alert"
          className="mb-4 w-full rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-900"
        >
          Passwords do not match. Please re-enter and try again.
        </p>
      ) : formError ? (
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
        <IconInput
          icon={<Lock className="size-[18px]" />}
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Set new password (min. 8 characters)"
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
          {isSubmitting ? "Creating account…" : "Sign up"}
        </AuthPrimaryButton>
      </form>

      <p className="mt-6 text-center text-sm text-foreground/80">
        Already have account?{" "}
        <Link href="/signin" className="font-medium text-[#5B86F7] hover:underline">
          Sign In
        </Link>
      </p>

      <LegalDisclaimer verb="signing up" />
    </AuthPageShell>
  );
}
