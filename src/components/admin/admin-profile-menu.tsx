"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { CircleUserRound } from "lucide-react";

import { useDashboardAuth } from "@/components/auth/dashboard-auth-provider";
import { cn } from "@/lib/utils";

function displayNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdminProfileMenu({ className }: { className?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, isLoading: authLoading, logout } = useDashboardAuth();

  const displayEmail = user?.email ?? (authLoading ? "…" : "admin@mediai.com");
  const displayName = user?.email
    ? displayNameFromEmail(user.email)
    : authLoading
      ? "…"
      : "Admin";
  const accountId = user?.id ? user.id.slice(0, 8).toUpperCase() : "—";

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Open profile menu"
        className="inline-flex max-w-[14rem] items-center gap-2 rounded-full border border-primary/10 py-1 pl-1 pr-2.5 transition-colors hover:bg-muted sm:max-w-xs sm:pr-3"
      >
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
          <CircleUserRound className="size-5" />
        </span>
        <span className="hidden min-w-0 flex-col items-start text-left sm:flex">
          <span className="truncate text-sm font-semibold leading-tight text-foreground">
            {displayName}
          </span>
          <span className="truncate text-[11px] leading-tight text-muted-foreground">
            Administrator
          </span>
        </span>
        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground sm:ml-0.5">
          Admin
        </span>
      </button>

      {menuOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-100 w-[min(16rem,calc(100vw-1.5rem))] rounded-2xl border border-primary/12 bg-white p-5 shadow-[0_24px_80px_-45px_rgba(73,96,188,0.75)]"
        >
          <div className="flex items-center gap-3">
            <div className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
              <CircleUserRound className="size-7" />
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                Admin
              </span>
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
              <p className="text-xs text-muted-foreground">Account: {accountId}</p>
            </div>
          </div>

          <div className="my-5 h-px bg-primary/15" />

          <nav className="space-y-3" role="none">
            <Link
              href="/"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="block text-left text-sm font-medium transition-colors hover:text-primary"
            >
              Public site
            </Link>
            <button
              type="button"
              role="menuitem"
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
  );
}
