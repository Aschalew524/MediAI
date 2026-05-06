import type { ReactNode } from "react";

import { AdminRoleGate } from "@/components/admin/admin-role-gate";
import { AdminShell } from "@/components/admin/chrome";
import { DashboardAuthProvider } from "@/components/auth/dashboard-auth-provider";

// Gate the whole /admin/* tree: unauthenticated visitors are redirected to
// /signin and authenticated non-admins see an "Access denied" panel. Inner
// per-section gates (blog/education) are kept as defense-in-depth and become
// no-ops once this outer gate has already enforced `appRole === "admin"`.
export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardAuthProvider>
      <AdminRoleGate deniedDescription="The MediAI admin console is limited to admin accounts. If you need access, contact your administrator.">
        <AdminShell>{children}</AdminShell>
      </AdminRoleGate>
    </DashboardAuthProvider>
  );
}
