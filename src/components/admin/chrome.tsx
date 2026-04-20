"use client";

import type { ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const adminNavItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className="size-4" />,
  },
  {
    label: "Users & Doctors",
    href: "/admin/users",
    icon: <Users className="size-4" />,
  },
  {
    label: "Subscriptions",
    href: "/admin/subscriptions",
    icon: <CreditCard className="size-4" />,
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <header className="relative z-40 border-b border-primary/10 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tight"
          >
            <ShieldCheck className="size-5 text-primary" />
            <span>
              <span className="text-primary">MediAI</span>
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Admin
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {adminNavItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/75 hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground/75 transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Link>
        </div>
      </header>

      <div className="md:hidden border-b border-primary/10 bg-background">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-6 py-2">
          {adminNavItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/75 hover:bg-muted hover:text-foreground",
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {children}
    </div>
  );
}
