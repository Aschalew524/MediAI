"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

import {
  AuthFormErrorAlert,
  AuthPageShell,
  AuthPrimaryButton,
  IconInput,
  MediAIWordmark,
} from "@/components/auth/shared";
import { postForgotPassword, userFacingAxiosError } from "@/lib/auth-api";

const successCopy = [
  "If an account exists for that email, we’ve sent a link to reset your password.",
  "Check your inbox and spam folder. The link expires in about one hour.",
].join(" ");

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError(null);
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "")
      .trim()
      .toLowerCase();
    if (!email) {
      setFormError("Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }
    try {
      await postForgotPassword({ email });
      setSubmitted(true);
    } catch (err) {
      setFormError(
        userFacingAxiosError(
          err,
          "We could not process your request. Please try again later.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageShell>
      <MediAIWordmark className="mb-6" />

      <div className="mb-4 flex w-full items-center gap-3">
        <Link
          href="/signin"
          aria-label="Back to sign in"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-white/80"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Forgot Password?</h1>
      </div>

      {submitted ? (
        <p
          className="mb-8 w-full rounded-xl border border-primary/20 bg-primary/5 px-3 py-3 text-sm leading-relaxed text-foreground"
          role="status"
        >
          {successCopy}
        </p>
      ) : (
        <>
          <p className="mb-8 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
            Please enter your email and we will send you the link to reset a password.
          </p>

          {formError ? <AuthFormErrorAlert message={formError} /> : null}

          <form className="w-full space-y-5" onSubmit={handleSubmit}>
            <IconInput
              icon={<Mail className="size-[18px]" />}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              required
            />
            <AuthPrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Submit"}
            </AuthPrimaryButton>
          </form>
        </>
      )}
    </AuthPageShell>
  );
}
