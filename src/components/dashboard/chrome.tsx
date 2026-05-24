"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { DevApiIndicator } from "./dev-api-indicator";
import { DashboardProfileMenu } from "./dashboard-profile-menu";
import { NotificationsBell } from "./notifications-bell";
import { useUnreadMessages } from "./use-unread-messages";
import { useDashboardProfile } from "./use-dashboard-profile";

/**
 * Routes that intentionally render full-bleed without the nav/avatar/menu
 * (e.g. the doctor verification gate, where the user isn't yet allowed into
 * the rest of the dashboard).
 */
const SHELL_BYPASS_PATHS: readonly string[] = ["/dashboard/verify-doctor"];

type NavLink = {
  href: string;
  label: string;
  icon: ReactNode;
  match?: (pathname: string) => boolean;
};

const PATIENT_NAV: NavLink[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: <LayoutDashboard className="size-4" />,
    match: (p) => p === "/dashboard",
  },
  {
    href: "/dashboard/ai-doctor",
    label: "AI Doctor",
    icon: <Stethoscope className="size-4" />,
    match: (p) => p.startsWith("/dashboard/ai-doctor"),
  },
  {
    href: "/dashboard/messages",
    label: "Messages",
    icon: <MessageCircleMore className="size-4" />,
    match: (p) => p.startsWith("/dashboard/messages"),
  },
  {
    href: "/dashboard/top-doctors",
    label: "Top Doctors",
    icon: <Users className="size-4" />,
    match: (p) => p.startsWith("/dashboard/top-doctors"),
  },
];

const PROFESSIONAL_NAV: NavLink[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: <LayoutDashboard className="size-4" />,
    match: (p) => p === "/dashboard",
  },
  {
    href: "/dashboard/patients",
    label: "Patients",
    icon: <Users className="size-4" />,
    match: (p) => p.startsWith("/dashboard/patients"),
  },
  {
    href: "/dashboard/ai-doctor",
    label: "Assistant",
    icon: <Sparkles className="size-4" />,
    match: (p) => p.startsWith("/dashboard/ai-doctor"),
  },
  {
    href: "/dashboard/messages",
    label: "Messages",
    icon: <MessageCircleMore className="size-4" />,
    match: (p) => p.startsWith("/dashboard/messages"),
  },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const profile = useDashboardProfile();
  const isProfessional = Boolean(profile.professionalProfile);
  const navLinks = isProfessional ? PROFESSIONAL_NAV : PATIENT_NAV;

  const bypassShell =
    pathname !== null &&
    SHELL_BYPASS_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );

  const unreadMessages = useUnreadMessages();

  if (bypassShell) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-primary/12 bg-linear-to-b from-background via-background/98 to-background/92 shadow-[0_8px_30px_-20px_rgba(76,104,220,0.35)] backdrop-blur-md supports-backdrop-filter:bg-background/85">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-4 px-4 sm:h-[4.75rem] sm:px-6 lg:gap-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <Link
              href="/dashboard"
              className="group inline-flex shrink-0 items-center gap-2.5"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-[0_12px_28px_-14px_rgba(76,104,220,0.85)] transition-transform group-hover:scale-[1.02]">
                M
              </span>
              <span className="hidden flex-col leading-tight sm:flex">
                <span className="text-lg font-bold tracking-tight text-primary">
                  MediAI
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {isProfessional ? "Professional" : "Patient"} dashboard
                </span>
              </span>
            </Link>

            <nav
              className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex"
              aria-label="Dashboard sections"
            >
              {navLinks.map((item) => {
                const active =
                  pathname !== null &&
                  (item.match?.(pathname) ??
                    (pathname === item.href ||
                      pathname.startsWith(`${item.href}/`)));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/12 text-primary shadow-[inset_0_0_0_1px_rgba(76,104,220,0.18)]"
                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <DevApiIndicator />
            <Link
              href="/dashboard/messages"
              className="relative inline-flex md:hidden"
              aria-label={
                unreadMessages > 0
                  ? `Messages (${unreadMessages} unread)`
                  : "Messages"
              }
            >
              <HeaderIconButton aria-label="Messages">
                <MessageCircleMore className="size-[1.125rem]" />
              </HeaderIconButton>
              {unreadMessages > 0 ? (
                <UnreadBadge count={unreadMessages} />
              ) : null}
            </Link>

            <NotificationsBell />
            <span
              className="mx-0.5 hidden h-8 w-px bg-primary/12 sm:block"
              aria-hidden
            />
            <DashboardProfileMenu />
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}

function UnreadBadge({ count }: { count: number }) {
  return (
    <span
      className="pointer-events-none absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground shadow-[0_2px_8px_-2px_rgba(220,38,38,0.6)] ring-2 ring-background"
      aria-hidden="true"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function HeaderIconButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full border border-primary/12 bg-background/80 text-muted-foreground shadow-sm transition-colors hover:border-primary/20 hover:bg-muted hover:text-primary sm:size-11",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TrustBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-primary/6 px-3 py-1.5 text-xs font-medium text-primary">
      <ShieldCheck className="size-4" />
      <span>Privacy-first health profile</span>
    </div>
  );
}
