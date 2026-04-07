import type { ComponentPropsWithoutRef, ReactNode } from "react";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

export function OnboardingShell({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"main">) {
  return (
    <main
      className={cn(
        "min-h-screen bg-background px-6 py-8 sm:px-10 sm:py-10 lg:px-16 lg:py-14",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-6xl flex-col">
        {children}
      </div>
    </main>
  );
}

export function BrandMark() {
  return (
    <Link
      href="/"
      className="inline-flex text-2xl font-bold tracking-tight text-primary"
    >
      MediAI
    </Link>
  );
}

export function OnboardingCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-10",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function StepTitle({
  title,
  description,
  align = "left",
}: {
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("space-y-2", align === "center" && "text-center")}>
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function StepNotice({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground",
        className,
      )}
    >
      <AlertTriangle className="size-4 shrink-0 text-destructive" />
      <span>{children}</span>
    </div>
  );
}

export function PrimaryButton({
  className,
  disabled,
  ...props
}: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}

export function SecondaryButton({
  className,
  ...props
}: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export function OptionCard({
  title,
  description,
  selected,
  onClick,
  className,
}: {
  title: string;
  description?: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-24 rounded-2xl border p-5 text-left transition-all",
        selected
          ? "border-primary bg-primary/80 text-primary-foreground shadow-[0_20px_50px_-34px_rgba(76,104,220,0.9)] ring-2 ring-primary/15"
          : "border-primary/10 bg-primary text-primary-foreground shadow-[0_20px_50px_-34px_rgba(76,104,220,0.72)] hover:bg-primary/90",
        className,
      )}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-xs text-sm leading-5 text-primary-foreground/85">
          {description}
        </p>
      ) : null}
    </button>
  );
}

export function ProgressHeader({
  title,
  currentStep,
  totalSteps,
}: {
  title: string;
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="grid w-full grid-cols-3 gap-1.5">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 rounded-full bg-muted",
              index <= currentStep && "bg-primary",
            )}
          />
        ))}
      </div>
    </div>
  );
}
