"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, Lock, Mail, User } from "lucide-react";

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
import { postRegister, userFacingAxiosError } from "@/lib/auth-api";
import { getGoogleOAuthStartUrl, isGoogleSignInUiEnabled } from "@/lib/auth-oauth";

// ---------------------------------------------------------------------------
// Password policy rules — kept in a single place so the checklist and the
// validation function always stay in sync.
// ---------------------------------------------------------------------------
type PasswordRule = { label: string; test: (pw: string) => boolean };

const PASSWORD_RULES: PasswordRule[] = [
  { label: "8–16 characters",           test: (pw) => pw.length >= 8 && pw.length <= 16 },
  { label: "One lowercase letter (a–z)", test: (pw) => /[a-z]/.test(pw) },
  { label: "One uppercase letter (A–Z)", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One number (0–9)",           test: (pw) => /\d/.test(pw) },
  { label: "One special character",     test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function validatePassword(pw: string): string | null {
  if (pw.length === 0) return "Password is required.";
  if (pw.length > 16) return "Password must be at most 16 characters.";
  const failing = PASSWORD_RULES.find((r) => !r.test(pw));
  if (failing) return failing.label + " required.";
  return null;
}

function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Name must be at least 2 characters.";
  if (trimmed.length > 100) return "Name must be at most 100 characters.";
  if (/^\d+$/.test(trimmed)) return "Name must not consist of numbers only.";
  return null;
}

// ---------------------------------------------------------------------------
// Password strength checklist
// ---------------------------------------------------------------------------
function PasswordChecklist({ password }: { password: string }) {
  if (password.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1 rounded-xl border border-border bg-white/70 px-3 py-2">
      {PASSWORD_RULES.map((rule) => {
        const passing = rule.test(password);
        return (
          <li
            key={rule.label}
            className={`flex items-center gap-2 text-xs transition-colors ${
              passing ? "text-emerald-600" : "text-muted-foreground"
            }`}
          >
            {passing ? (
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
            ) : (
              <Circle className="size-3.5 shrink-0 text-muted-foreground/40" />
            )}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function SignUpEmailPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showGoogle = isGoogleSignInUiEnabled();

  // Eagerly show checklist only once the user has typed in the password field
  const [passwordTouched, setPasswordTouched] = useState(false);

  const allRulesPassing = useMemo(
    () => PASSWORD_RULES.every((r) => r.test(password)),
    [password],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setMismatch(false);

    const fd = new FormData(e.currentTarget);
    const nameVal = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "");
    const pw = String(fd.get("password") ?? "");
    const confirmPw = String(fd.get("confirmPassword") ?? "");

    // Client-side name validation
    const nameError = validateName(nameVal);
    if (nameError) {
      setFormError(nameError);
      return;
    }

    // Client-side password validation
    const pwError = validatePassword(pw);
    if (pwError) {
      setFormError(pwError);
      return;
    }

    // Confirm password check
    if (pw !== confirmPw) {
      setMismatch(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // name is validated on the frontend; the backend will enforce the same
      // rules via class-validator once the field is wired to the User model.
      await postRegister({ email, password: pw });
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
          href="/signin"
          aria-label="Back to sign in page"
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
        <AuthFormErrorAlert message={formError} />
      ) : null}

      <form className="w-full space-y-4" onSubmit={handleSubmit}>
        {/* Name */}
        <IconInput
          icon={<User className="size-[18px]" />}
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          maxLength={100}
          required
        />

        {/* Email */}
        <IconInput
          icon={<Mail className="size-[18px]" />}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          required
        />

        {/* Password + live checklist */}
        <div>
          <IconInput
            icon={<Lock className="size-[18px]" />}
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordTouched(true);
            }}
            maxLength={16}
            required
          />
          {passwordTouched && <PasswordChecklist password={password} />}
        </div>

        {/* Confirm password */}
        <IconInput
          icon={<Lock className="size-[18px]" />}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Confirm your password"
          maxLength={16}
          required
        />

        <AuthPrimaryButton
          type="submit"
          disabled={isSubmitting || (passwordTouched && !allRulesPassing)}
        >
          {isSubmitting ? "Creating account…" : "Sign up"}
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
      ) : null}

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
