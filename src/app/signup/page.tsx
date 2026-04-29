import Link from "next/link";
import { Mail } from "lucide-react";

import { AuthPageShell, LegalDisclaimer, MediAIWordmark } from "@/components/auth/shared";

/**
 * v1: email sign-up only. Google OAuth is deferred to a later release.
 */
export default function SignUpPage() {
  return (
    <AuthPageShell>
      <MediAIWordmark className="mb-2" />
      <h1 className="mb-10 text-2xl font-bold text-foreground">
        Create your account
      </h1>

      <div className="flex w-full flex-col gap-0">
        <Link
          href="/signup/email"
          className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#5B86F7]/35 bg-white text-sm font-medium text-foreground/80 transition-colors hover:bg-muted/30"
        >
          <Mail className="size-[18px] text-muted-foreground" />
          Sign up with email
        </Link>
      </div>

      <p className="mt-8 text-center text-sm text-foreground/80">
        Already have account?{" "}
        <Link href="/signin" className="font-medium text-[#5B86F7] hover:underline">
          Sign In
        </Link>
      </p>

      <LegalDisclaimer verb="signing up" />
    </AuthPageShell>
  );
}
