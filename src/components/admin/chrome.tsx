"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  BookOpen,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  Menu,
  Newspaper,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import { AdminProfileMenu } from "@/components/admin/admin-profile-menu";
import { cn } from "@/lib/utils";

const adminNavItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Users & Doctors",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Doctor verifications",
    href: "/admin/verifications",
    icon: BadgeCheck,
  },
  {
    label: "Subscriptions",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    label: "Revenue",
    href: "/admin/revenue",
    icon: DollarSign,
  },
  {
    label: "Blog",
    href: "/admin/blog",
    icon: Newspaper,
  },
  {
    label: "Help pages",
    href: "/admin/education",
    icon: BookOpen,
  },
] as const;

function isNavItemActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === "/admin"
    : pathname === href || pathname.startsWith(`${href}/`);
}

function AdminSidebarNav({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1 p-3", className)} aria-label="Admin">
      {adminNavItems.map((item) => {
        const isActive = pathname ? isNavItemActive(pathname, item.href) : false;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-foreground/75 hover:bg-muted/80 hover:text-foreground",
            )}
          >
            {isActive ? (
              <span
                className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary"
                aria-hidden
              />
            ) : null}
            <Icon
              className={cn(
                "size-4 shrink-0",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-primary/10 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              {mobileNavOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>

            <Link
              href="/admin"
              className="inline-flex min-w-0 items-center gap-2.5"
            >
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-lg font-bold tracking-tight text-primary">
                  MediAI
                </span>
                <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Admin
                </span>
              </span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <Link
              href="/admin"
              aria-label="Notifications"
              className="inline-flex size-9 items-center justify-center rounded-full border border-primary/10 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              <Bell className="size-4" />
            </Link>
            <AdminProfileMenu />
          </div>
        </div>
      </header>

      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-[1px] lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[min(18rem,88vw)] flex-col border-r border-primary/10 bg-background pt-16 shadow-xl transition-transform duration-200 ease-out lg:hidden",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!mobileNavOpen}
      >
        <div className="border-b border-primary/8 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </p>
        </div>
        <AdminSidebarNav
          className="flex-1 overflow-y-auto"
          onNavigate={() => setMobileNavOpen(false)}
        />
      </aside>

      <div className="lg:flex">
        <aside className="hidden w-60 shrink-0 border-r border-primary/10 bg-muted/20 lg:block">
          <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="border-b border-primary/8 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Console
              </p>
            </div>
            <AdminSidebarNav />
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
