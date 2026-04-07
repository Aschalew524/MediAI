import type { ComponentPropsWithoutRef, ReactNode } from "react";

import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function DashboardContainer({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8", className)}
      {...props}
    />
  );
}

export function DashboardPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <main className={cn("py-7 sm:py-9", className)}>{children}</main>;
}

export function DashboardPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-primary/12 bg-white p-5 sm:p-6 shadow-[0_26px_70px_-46px_rgba(76,104,220,0.35)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CompletionRing({
  value,
  label,
  size = "md",
}: {
  value: number;
  label?: string;
  size?: "sm" | "md";
}) {
  const dimension = size === "sm" ? "size-10" : "size-12";
  const inner = size === "sm" ? "size-8 text-[10px]" : "size-10 text-xs";
  const degrees = Math.max(0, Math.min(value, 100)) * 3.6;

  return (
    <div className="inline-flex items-center gap-3">
      <div
        className={cn(
          "relative inline-flex items-center justify-center rounded-full bg-[conic-gradient(var(--color-primary)_0deg,var(--color-primary)_var(--progress),var(--color-muted)_var(--progress),var(--color-muted)_360deg)]",
          dimension,
        )}
        style={{ ["--progress" as string]: `${degrees}deg` }}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-background text-primary shadow-inner",
            inner,
          )}
        >
          {value}%
        </div>
      </div>
      {label ? <span className="text-sm font-medium text-muted-foreground">{label}</span> : null}
    </div>
  );
}

export function CompletionBar({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 w-48 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-primary">
        {value}% {label ?? ""}
      </span>
    </div>
  );
}

export function DashboardSectionHeader({
  title,
  description,
  trailing,
}: {
  title: string;
  description?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{title}</h1>
        {description ? (
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {trailing}
    </div>
  );
}

export function DashboardBackTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-3">
      <Link
        href="/dashboard"
        aria-label="Back to dashboard"
        className="inline-flex size-10 items-center justify-center rounded-full border border-primary/15 text-foreground/80 transition-colors hover:bg-muted hover:text-primary"
      >
        <ArrowLeft className="size-4" />
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{title}</h1>
      {description ? (
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function DashboardListRow({
  href,
  title,
  trailing,
}: {
  href?: string;
  title: string;
  trailing?: ReactNode;
}) {
  const content = (
    <div className="flex items-center justify-between gap-4 py-4.5">
      <span className="text-[15px] font-medium sm:text-base">{title}</span>
      <div className="flex items-center gap-3 text-muted-foreground">
        {trailing}
        <ChevronRight className="size-4.5" />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block border-b border-primary/10 last:border-b-0"
      >
        {content}
      </Link>
    );
  }

  return <div className="border-b border-primary/10 last:border-b-0">{content}</div>;
}

export function DashboardActionButton({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
