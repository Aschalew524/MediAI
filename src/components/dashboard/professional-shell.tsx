"use client";

import type { ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleHelp,
  ClipboardPlus,
  FileText,
  History,
  UserRound,
  Users,
} from "lucide-react";

import {
  type DashboardProfile,
  getProfessionalName,
} from "@/lib/dashboard-content";
import type { ApiPatientSummary } from "@/lib/services/professional-api";
import { cn } from "@/lib/utils";

import { DashboardContainer, DashboardPage } from "./primitives";

/**
 * Lightweight patient view-model used by the professional clinical-assistant
 * UI. Built from `ApiPatientSummary` so every piece — the dropdown, the chat
 * header, the history page — references the same UUID and display strings as
 * the backend.
 */
export type ProfessionalPatient = {
  id: string;
  name: string;
  age: string;
  sex: string;
};

type ProfessionalSidebarItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

const professionalSidebarSections: {
  title?: string;
  items: ProfessionalSidebarItem[];
}[] = [
  {
    title: "Patients",
    items: [
      {
        label: "All patients",
        href: "/dashboard/patients",
        icon: <Users className="size-4" />,
      },
    ],
  },
  {
    title: "AI Assistant",
    items: [
      {
        label: "Clinical Assistant",
        href: "/dashboard/ai-doctor",
        icon: <ClipboardPlus className="size-4" />,
      },
      {
        label: "Research Assistant",
        href: "/dashboard/ai-doctor/general",
        icon: <FileText className="size-4" />,
      },
      {
        label: "Conversation History",
        href: "/dashboard/ai-doctor/history",
        icon: <History className="size-4" />,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        label: "Public profile",
        href: "/dashboard/verify-doctor?edit=1",
        icon: <UserRound className="size-4" />,
      },
    ],
  },
  {
    items: [
      {
        label: "Help and support",
        href: "/knowledge-base",
        icon: <CircleHelp className="size-4" />,
      },
    ],
  },
];

/** Map a backend `ApiPatientSummary` to the lighter `ProfessionalPatient` view-model. */
export function toProfessionalPatient(
  api: ApiPatientSummary,
): ProfessionalPatient {
  return {
    id: api.id,
    name: api.preferredName?.trim() || api.email,
    age: api.age || "—",
    sex:
      api.sexAtBirth === "male"
        ? "Male"
        : api.sexAtBirth === "female"
          ? "Female"
          : "Other",
  };
}

export function formatProfessionalPatient(patient: ProfessionalPatient) {
  return `${patient.name} ${patient.age} y.o ${patient.sex}`;
}

export function formatProfessionalPatientCompact(patient: ProfessionalPatient) {
  return `${patient.name} - ${patient.age} y.o ${patient.sex}`;
}

export function ProfessionalDashboardShell({
  profile,
  children,
  contentClassName,
}: {
  profile: DashboardProfile;
  children: ReactNode;
  contentClassName?: string;
}) {
  const professionalName = getProfessionalName(profile);

  return (
    <DashboardPage>
      <DashboardContainer className="max-w-screen-2xl px-6 sm:px-8 xl:px-10">
        <div className="grid gap-6 xl:grid-cols-[180px_minmax(0,1fr)] xl:gap-8">
          <aside className="pt-8">
            <div className="sticky top-24">
              <div className="space-y-9">
                <div className="space-y-1 px-1">
                  <p className="text-sm font-semibold text-foreground">
                    {professionalName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile.professionalProfile?.specialty || "Health Professional"}
                  </p>
                </div>

                {professionalSidebarSections.map((section, index) => (
                  <ProfessionalSidebarSection
                    key={section.title ?? `section-${index}`}
                    title={section.title}
                    items={section.items}
                  />
                ))}
              </div>
            </div>
          </aside>

          <main className={cn("space-y-6 pt-8", contentClassName)}>
            {children}
          </main>
        </div>
      </DashboardContainer>
    </DashboardPage>
  );
}

function ProfessionalSidebarSection({
  title,
  items,
}: {
  title?: string;
  items: ProfessionalSidebarItem[];
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-3">
      {title ? (
        <p className="px-1 text-xs font-medium text-muted-foreground/80">
          {title}
        </p>
      ) : null}
      <div className="space-y-1">
        {items.map((item) => {
          const isActive =
            item.href !== "/dashboard"
              ? pathname === item.href || pathname.startsWith(`${item.href}/`)
              : pathname === "/dashboard";

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "group flex min-h-10 items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors sm:min-h-0 sm:px-1 sm:py-1",
                isActive
                  ? "text-foreground"
                  : "text-foreground/80 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-5 items-center justify-center transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-primary/85 group-hover:text-primary",
                )}
              >
                {item.icon}
              </span>
              <span className={cn("font-medium", isActive && "font-semibold")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

