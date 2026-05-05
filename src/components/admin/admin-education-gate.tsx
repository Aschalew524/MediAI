"use client";

import type { ReactNode } from "react";

import { AdminRoleGate } from "@/components/admin/admin-role-gate";

export function AdminEducationGate({ children }: { children: ReactNode }) {
  return (
    <AdminRoleGate
      deniedDescription="Help page editing is limited to MediAI admin accounts. If you need access, contact your administrator."
    >
      {children}
    </AdminRoleGate>
  );
}
