"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Mail } from "lucide-react";

import {
  AuthPageShell,
  AuthPrimaryButton,
  IconInput,
  LegalDisclaimer,
  MediAIWordmark,
} from "@/components/auth/shared";

export default function SignUpEmailPage() {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const p = String(fd.get("password") ?? "");
    const c = String(fd.get("confirmPassword") ?? "");
    if (p !== c) {
      return;
    }
    router.push("/dashboard");
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
          placeholder="Set new password"
          required
        />
        <IconInput
          icon={<Lock className="size-[18px]" />}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Confirm new password"
          required
        />
        <AuthPrimaryButton type="submit">Sign up</AuthPrimaryButton>
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
