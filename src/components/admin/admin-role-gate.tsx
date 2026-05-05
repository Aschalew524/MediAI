"use client";

import { useEffect, type ReactNode } from "react";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { useDashboardAuth } from "@/components/auth/dashboard-auth-provider";
import {
  DashboardContainer,
  DashboardPage,
  DashboardPanel,
} from "@/components/dashboard/primitives";
import { redirectToSignInWithCurrentPath } from "@/lib/redirect-signin";

export function AdminRoleGate({
  children,
  deniedDescription,
}: {
  children: ReactNode;
  deniedDescription: string;
}) {
  const { user, isLoading, isAuthenticated } = useDashboardAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      redirectToSignInWithCurrentPath();
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <DashboardPage>
        <DashboardContainer>
          <p className="text-sm text-muted-foreground">Checking access…</p>
        </DashboardContainer>
      </DashboardPage>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardPage>
        <DashboardContainer>
          <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
        </DashboardContainer>
      </DashboardPage>
    );
  }

  if (user?.appRole !== "admin") {
    return (
      <DashboardPage>
        <DashboardContainer className="max-w-lg space-y-6">
          <DashboardPanel className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <ShieldAlert className="size-5" />
              </span>
              <div className="space-y-2">
                <h1 className="text-lg font-semibold tracking-tight">Access denied</h1>
                <p className="text-sm leading-6 text-muted-foreground">{deniedDescription}</p>
                <Link
                  href="/"
                  className="inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Back to home
                </Link>
              </div>
            </div>
          </DashboardPanel>
        </DashboardContainer>
      </DashboardPage>
    );
  }

  return children;
}
