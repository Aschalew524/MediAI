"use client";

import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

import {
  AuthPageShell,
  AuthPrimaryButton,
  IconInput,
  MediAIWordmark,
} from "@/components/auth/shared";

export default function ForgotPasswordPage() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Wire to reset API when available
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

      <p className="mb-8 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
        Please enter your email and we will send you the link to reset a password.
      </p>

      <form className="w-full space-y-5" onSubmit={handleSubmit}>
        <IconInput
          icon={<Mail className="size-[18px]" />}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          required
        />
        <AuthPrimaryButton type="submit">Submit</AuthPrimaryButton>
      </form>
    </AuthPageShell>
  );
}
