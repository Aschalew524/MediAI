import type { ComponentPropsWithoutRef, ReactNode } from "react";

import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export function Container({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-6 lg:px-8", className)}
      {...props}
    />
  );
}

export function SectionHeading({
  badge,
  title,
  description,
  className,
  centered = true,
}: {
  badge?: string;
  title: string;
  description?: string;
  className?: string;
  centered?: boolean;
}) {
  return (
    <div
      className={cn(
        "space-y-4",
        centered ? "mx-auto max-w-3xl text-center" : "max-w-xl text-left",
        className,
      )}
    >
      {badge ? (
        <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/8 px-4 py-1 text-sm font-medium text-primary">
          {badge}
        </span>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

const linkButtonVariants = cva(
  "inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[0_18px_40px_-24px_oklch(0.67_0.16_266/.95)] hover:translate-y-[-1px] hover:opacity-95",
        secondary:
          "border border-primary/15 bg-white text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        light:
          "bg-white text-primary shadow-[0_14px_30px_-20px_rgba(255,255,255,0.95)] hover:bg-white/90",
      },
      size: {
        sm: "h-10 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type LinkButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
} & VariantProps<typeof linkButtonVariants>;

export function LinkButton({
  href,
  children,
  variant,
  size,
  className,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(linkButtonVariants({ variant, size }), className)}
    >
      {children}
    </Link>
  );
}

export function SectionShell({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"section"> & {
  children: ReactNode;
}) {
  return (
    <section
      className={cn("relative py-20 sm:py-24 lg:py-28", className)}
      {...props}
    >
      {children}
    </section>
  );
}
