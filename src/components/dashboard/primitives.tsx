import type { ComponentPropsWithoutRef, ReactNode } from "react";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function DashboardContainer({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-5xl px-6 lg:px-8", className)}
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
  return <main className={cn("py-6 sm:py-8", className)}>{children}</main>;
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
        "rounded-2xl border border-primary/15 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(76,104,220,0.3)]",
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
      {label ? <span className="text-sm text-muted-foreground">{label}</span> : null}
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
    <div className="flex items-center gap-4">
      <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
        />
      </div>
      <span className="text-sm font-medium text-primary">
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
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
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
    <div className="space-y-2">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
      >
        <span className="text-lg">←</span>
        <span>My Dashboard</span>
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
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
    <div className="flex items-center justify-between gap-4 py-4">
      <span className="text-base font-medium">{title}</span>
      <div className="flex items-center gap-4 text-muted-foreground">
        {trailing}
        <ChevronRight className="size-5" />
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
        "inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
