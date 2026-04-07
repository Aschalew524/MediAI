import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Matches design: “Medi” blue, “AI” dark */
export function MediAIWordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "text-3xl font-bold tracking-tight no-underline hover:opacity-90",
        className,
      )}
    >
      <span className="text-[#5B86F7]">Medi</span>
      <span className="text-foreground">AI</span>
    </Link>
  );
}

export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[#f5f6f8] px-4 py-12">
      <div className="flex w-full max-w-[400px] flex-col items-center">
        {children}
      </div>
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="relative my-6 w-full">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-[#f5f6f8] px-3 text-muted-foreground">OR</span>
      </div>
    </div>
  );
}

export function LegalDisclaimer({ verb }: { verb: "signing in" | "signing up" }) {
  return (
    <p className="mt-8 max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
      By {verb} you agree to the{" "}
      <Link href="/#contact" className="text-[#5B86F7] underline underline-offset-2">
        Terms of Use
      </Link>{" "}
      <Link href="/#contact" className="text-[#5B86F7] underline underline-offset-2">
        Privacy Policy
      </Link>{" "}
      and{" "}
      <Link href="/#contact" className="text-[#5B86F7] underline underline-offset-2">
        Cookie Policy
      </Link>
    </p>
  );
}

export function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={cn("size-5 shrink-0", className)} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type IconInputProps = {
  icon: ReactNode;
  className?: string;
} & ComponentPropsWithoutRef<"input">;

export function IconInput({ icon, className, ...props }: IconInputProps) {
  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {icon}
      </span>
      <input
        className={cn(
          "h-12 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-[box-shadow,border-color] focus:border-[#5B86F7]/50 focus:ring-2 focus:ring-[#5B86F7]/20",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function AuthPrimaryButton({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type="submit"
      className={cn(
        "flex h-12 w-full items-center justify-center rounded-xl bg-[#5B86F7] text-base font-semibold text-white transition-opacity hover:opacity-95 active:opacity-90",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function AuthOutlineButton({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#5B86F7]/35 bg-white text-sm font-medium text-foreground/80 transition-colors hover:bg-muted/30",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
