import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/chrome";
import { DashboardAuthProvider } from "@/components/auth/dashboard-auth-provider";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardAuthProvider>
      <AdminShell>{children}</AdminShell>
    </DashboardAuthProvider>
  );
}
