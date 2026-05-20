"use client";

import type { ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircleMore, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

import { DashboardProfileMenu } from "./dashboard-profile-menu";
import { NotificationsBell } from "./notifications-bell";
import { useUnreadMessages } from "./use-unread-messages";

/**
 * Routes that intentionally render full-bleed without the nav/avatar/menu
 * (e.g. the doctor verification gate, where the user isn't yet allowed into
 * the rest of the dashboard).
 */
const SHELL_BYPASS_PATHS: readonly string[] = ["/dashboard/verify-doctor"];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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
      <header className="relative z-40 border-b border-primary/10 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <span className="text-primary">🏠</span>
            <span className="hidden sm:inline">My Dashboard</span>
          </Link>

          <Link
            href="/dashboard"
            className="text-xl font-bold tracking-tight text-primary"
          >
            MediAI
          </Link>

          <div className="relative flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard/messages"
              className="relative inline-flex"
              aria-label={
                unreadMessages > 0
                  ? `Messages (${unreadMessages} unread)`
                  : "Messages"
              }
            >
              <HeaderIconButton aria-label="Messages">
                <MessageCircleMore className="size-4" />
              </HeaderIconButton>
              {unreadMessages > 0 ? (
                <span
                  className="pointer-events-none absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground shadow-[0_2px_8px_-2px_rgba(220,38,38,0.6)] ring-2 ring-background"
                  aria-hidden="true"
                >
                  {unreadMessages > 99 ? "99+" : unreadMessages}
                </span>
              ) : null}
            </Link>
            <NotificationsBell />
            <DashboardProfileMenu />
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}

function HeaderIconButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border border-primary/10 text-muted-foreground transition-colors hover:bg-muted hover:text-primary",
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
