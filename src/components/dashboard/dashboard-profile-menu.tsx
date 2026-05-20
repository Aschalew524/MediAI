"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { CircleUserRound } from "lucide-react";

import { useDashboardAuth } from "@/components/auth/dashboard-auth-provider";
import {
  getMyBilling,
  getMySubscription,
  type MyBillingResponse,
  type MySubscription,
} from "@/lib/payments-api";
import {
  getProfileName,
  getProfessionalName,
} from "@/lib/dashboard-content";
import { cn } from "@/lib/utils";

import { useDashboardProfile } from "./use-dashboard-profile";

const MENU_LINKS = [
  { label: "Help & Support", href: "/knowledge-base" },
  { label: "Billing", href: "/dashboard/billing" },
  { label: "Account Settings", href: "/dashboard/account-settings" },
] as const;

export function DashboardProfileMenu({ className }: { className?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [billing, setBilling] = useState<MyBillingResponse | null>(null);
  const [subscription, setSubscription] = useState<MySubscription | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, isLoading: authLoading, logout } = useDashboardAuth();
  const profile = useDashboardProfile();
  const isProfessional = Boolean(profile.professionalProfile);
  const displayName = isProfessional
    ? getProfessionalName(profile)
    : getProfileName(profile);
  const displayEmail = user?.email
    ? user.email
    : authLoading
      ? "…"
      : `${displayName.toLowerCase().replace(/\s+/g, "")}@gmail.com`;
  const accountId = user?.id ? user.id.slice(0, 8).toUpperCase() : "—";

  // Three-way precedence: a paid `SubscriptionPlan` row beats the legacy
  // assistant-access pass beats Free. Pros aren't billed at all in V1, so
  // they get a specialty-derived label and no plan badge.
  const activeSubscription =
    user?.id && subscription?.active ? subscription : null;
  const activeAssistant =
    user?.id && billing?.assistantAccess.active ? billing.assistantAccess : null;
  const planBadge = activeSubscription?.planName
    ? activeSubscription.planName.toUpperCase()
    : activeAssistant
      ? "PAID"
      : "FREE";
  const planSubline = activeSubscription
    ? `${activeSubscription.planName ?? "Plan"} · ${activeSubscription.interval ?? ""}`.trim()
    : activeAssistant
      ? activeAssistant.planName ?? "Assistant access active"
      : isProfessional
        ? profile.professionalProfile?.specialty || "Health professional"
        : "General chat only";

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

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return;

    void getMyBilling()
      .then((next) => {
        if (!cancelled) setBilling(next);
      })
      .catch(() => {
        if (!cancelled) setBilling(null);
      });

    void getMySubscription()
      .then((next) => {
        if (!cancelled) setSubscription(next);
      })
      .catch(() => {
        if (!cancelled) setSubscription(null);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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
            {planSubline}
          </span>
        </span>
        {!isProfessional ? (
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground sm:ml-0.5">
            {planBadge}
          </span>
        ) : null}
      </button>

      {menuOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-100 w-[min(16rem,calc(100vw-1.5rem))] rounded-2xl border border-primary/12 bg-white p-5 shadow-[0_24px_80px_-45px_rgba(73,96,188,0.75)]"
        >
          <div className="flex items-center gap-3">
            <div className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
              <CircleUserRound className="size-7" />
              {!isProfessional ? (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {planBadge}
                </span>
              ) : null}
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
            {MENU_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="block text-left text-sm font-medium transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            {isProfessional ? (
              <Link
                href="/dashboard/verify-doctor?edit=1"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="block text-left text-sm font-medium transition-colors hover:text-primary"
              >
                Public profile
              </Link>
            ) : null}
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
