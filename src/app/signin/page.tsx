"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";

import {
  AuthOutlineButton,
  AuthPageShell,
  AuthPrimaryButton,
  GoogleMark,
  IconInput,
  LegalDisclaimer,
  MediAIWordmark,
  OrDivider,
} from "@/components/auth/shared";

export default function SignInPage() {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // After real auth succeeds, keep this navigation (or use returned redirect).
    router.push("/dashboard");
  }

  function handleGoogle() {
    router.push("/dashboard");
  }

  return (
    <AuthPageShell>
      <MediAIWordmark className="mb-2" />
      <h1 className="mb-8 text-2xl font-bold text-foreground">Welcome Back!</h1>

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
        <AuthPrimaryButton type="submit">Sign In</AuthPrimaryButton>
      </form>

      <p className="mt-6 text-center text-sm text-foreground/80">
        Don&apos;t have account?{" "}
        <Link href="/signup" className="font-medium text-[#5B86F7] hover:underline">
          Sign Up
        </Link>
      </p>

      <OrDivider />

      <AuthOutlineButton
        type="button"
        aria-label="Continue with Google"
        onClick={handleGoogle}
      >
        <GoogleMark />
        Continue with Google
      </AuthOutlineButton>

      <LegalDisclaimer verb="signing in" />
    </AuthPageShell>
  );
}
