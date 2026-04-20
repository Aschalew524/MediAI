"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CircleUserRound, MessageCircleMore, ShieldCheck } from "lucide-react";

import { getProfileName } from "@/lib/dashboard-content";
import { cn } from "@/lib/utils";

import { useDashboardProfile } from "./use-dashboard-profile";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const profile = useDashboardProfile();
  const name = getProfileName(profile);
  const email = `${name.toLowerCase().replace(/\s+/g, "")}@gmail.com`;

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
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <header className="relative z-40 border-b border-primary/10 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <span className="text-primary">🏠</span>
            <span>My Dashboard</span>
          </Link>

          <Link
            href="/dashboard"
            className="text-xl font-bold tracking-tight text-primary"
          >
            MediAI
          </Link>

          <div className="relative flex items-center gap-3">
            <HeaderIconButton aria-label="Messages">
              <MessageCircleMore className="size-4" />
            </HeaderIconButton>
            <Link href="/dashboard/notifications">
              <HeaderIconButton aria-label="Notifications">
                <Bell className="size-4" />
              </HeaderIconButton>
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Open profile menu"
                className="inline-flex items-center gap-2 rounded-full border border-primary/10 px-2 py-1 transition-colors hover:bg-muted"
              >
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                  Free
                </span>
                <CircleUserRound className="size-5 text-muted-foreground" />
              </button>

              {menuOpen ? (
                <div className="absolute right-0 top-12 z-100 w-64 rounded-2xl border border-primary/12 bg-white p-5 shadow-[0_24px_80px_-45px_rgba(73,96,188,0.75)]">
                  <div className="flex items-center gap-3">
                    <div className="relative inline-flex size-12 items-center justify-center rounded-full bg-muted text-primary">
                      <CircleUserRound className="size-7" />
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        Free
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">{email}</p>
                      <p className="text-xs text-muted-foreground">Account ID: 292556</p>
                    </div>
                  </div>

                  <div className="my-6 h-px bg-primary/15" />

                  <nav className="space-y-3">
                    {[
                      { label: "Help & Support", href: "/knowledge-base" },
                      { label: "Billing", href: "/pricing" },
                      { label: "Account Settings", href: "/dashboard/account-settings" },
                      { label: "Sign Out", href: "/" },
                    ].map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="block text-left text-sm font-medium transition-colors hover:text-primary"
                      >
                        {item.label}
                      </Link>
                    ))}
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
