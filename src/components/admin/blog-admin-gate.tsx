"use client";

import type { ReactNode } from "react";

import { AdminRoleGate } from "@/components/admin/admin-role-gate";

export function AdminBlogGate({ children }: { children: ReactNode }) {
  return (
    <AdminRoleGate
      deniedDescription="Blog authoring is limited to MediAI admin accounts. If you need access, contact your administrator."
    >
      {children}
    </AdminRoleGate>
  );
}
