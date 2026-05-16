"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePathname } from "next/navigation";
import { Bell, CircleUserRound, MessageCircleMore, ShieldCheck } from "lucide-react";

import { getProfileName } from "@/lib/dashboard-content";
import { getMyBilling, type MyBillingResponse } from "@/lib/payments-api";
import { useDashboardAuth } from "@/components/auth/dashboard-auth-provider";
import { cn } from "@/lib/utils";

import { useDashboardProfile } from "./use-dashboard-profile";
import { useUnreadMessages } from "./use-unread-messages";

/**
 * Routes that intentionally render full-bleed without the nav/avatar/menu
 * (e.g. the doctor verification gate, where the user isn't yet allowed into
 * the rest of the dashboard).
 */
const SHELL_BYPASS_PATHS: readonly string[] = ["/dashboard/verify-doctor"];
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

  const pathname = usePathname();
  const bypassShell =
    pathname !== null &&
    SHELL_BYPASS_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );

  const [menuOpen, setMenuOpen] = useState(false);
  const [billing, setBilling] = useState<MyBillingResponse | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, isLoading: authLoading, logout } = useDashboardAuth();
  const profile = useDashboardProfile();
  const unreadMessages = useUnreadMessages();
  const unreadMessages = useUnreadMessages();
  const name = getProfileName(profile);
  const displayEmail = user?.email
    ? user.email
    : authLoading
      ? "…"
      : `${name.toLowerCase().replace(/\s+/g, "")}@gmail.com`;
  const accountId = user?.id
    ? user.id.slice(0, 8).toUpperCase()
    : "—";
  const billingState = user?.id ? billing : null;
  const assistantBadge = billingState?.assistantAccess.active ? "Paid" : "Free";
  const assistantSubline = billingState?.assistantAccess.active
    ? billingState.assistantAccess.planName ?? "Assistant access active"
    : "General chat only";

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return;

    void getMyBilling()
      .then((next) => {
        if (!cancelled) {
          setBilling(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBilling(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, user?.id]);

  if (bypassShell) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="relative z-40 border-b border-primary/10 bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
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
            <Link href="/dashboard/notifications">
              <HeaderIconButton aria-label="Notifications">
                <Bell className="size-4" />
              </HeaderIconButton>
            </Link>
            <div
              className="relative"
              ref={menuRef}
            >
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Open profile menu"
                className="inline-flex items-center gap-2 rounded-full border border-primary/10 px-2 py-1 transition-colors hover:bg-muted"
              >
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                  {assistantBadge}
                </span>
                <CircleUserRound className="size-5 text-muted-foreground" />
              </button>

              {menuOpen ? (
                <div className="absolute right-0 top-12 z-100 w-[min(16rem,calc(100vw-1.5rem))] rounded-2xl border border-primary/12 bg-white p-5 shadow-[0_24px_80px_-45px_rgba(73,96,188,0.75)]">
                  <div className="flex items-center gap-3">
                    <div className="relative inline-flex size-12 items-center justify-center rounded-full bg-muted text-primary">
                      <CircleUserRound className="size-7" />
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        {assistantBadge}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">{displayEmail}</p>
                      <p className="text-xs text-muted-foreground">
                        Account: {accountId}
                      </p>
                      <p className="text-xs text-muted-foreground">{assistantSubline}</p>
                    </div>
                  </div>

                  <div className="my-6 h-px bg-primary/15" />

                  <nav className="space-y-3">
                    {(
                      [
                        { label: "Help & Support", href: "/knowledge-base" },
                        { label: "Health Blog", href: "/dashboard/blog" },
                        { label: "Billing", href: "/pricing" },
                        { label: "Account Settings", href: "/dashboard/account-settings" },
                      ] as const
                    ).map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="block text-left text-sm font-medium transition-colors hover:text-primary"
                      >
                        {item.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left text-sm font-medium text-foreground transition-colors hover:text-primary"
                    >
                      Sign Out
                    </button>
                  </nav>
                </div>
              ) : null}
            </div>
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
        "inline-flex size-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-primary/10 text-muted-foreground transition-colors hover:bg-muted hover:text-primary sm:size-10 sm:min-h-10 sm:min-w-10",
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
