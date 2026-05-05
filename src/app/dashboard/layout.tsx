import type { ReactNode } from "react";
import { Suspense } from "react";

import { DashboardAuthProvider } from "@/components/auth/dashboard-auth-provider";
import { GoogleOAuthDashboardBootstrap } from "@/components/auth/google-oauth-dashboard-bootstrap";
import {
  DashboardMeProvider,
  DashboardWithMeEntrance,
} from "@/components/dashboard/dashboard-me-provider";
import { DashboardShell } from "@/components/dashboard/chrome";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardAuthProvider>
      <Suspense fallback={null}>
        <GoogleOAuthDashboardBootstrap />
      </Suspense>
      <DashboardMeProvider>
        <DashboardWithMeEntrance>
          <DashboardShell>{children}</DashboardShell>
        </DashboardWithMeEntrance>
      </DashboardMeProvider>
    </DashboardAuthProvider>
  );
}
