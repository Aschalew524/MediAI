import type { ReactNode } from "react";

import { DashboardAuthProvider } from "@/components/auth/dashboard-auth-provider";
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
      <DashboardMeProvider>
        <DashboardWithMeEntrance>
          <DashboardShell>{children}</DashboardShell>
        </DashboardWithMeEntrance>
      </DashboardMeProvider>
    </DashboardAuthProvider>
  );
}
