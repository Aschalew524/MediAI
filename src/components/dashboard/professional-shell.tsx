"use client";

import type { ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleHelp,
  ClipboardPlus,
  FileText,
  FlaskConical,
  History,
  Plus,
  Users,
} from "lucide-react";

import {
  type DashboardProfile,
  getProfileName,
  getProfileSex,
} from "@/lib/dashboard-content";
import { cn } from "@/lib/utils";

import { DashboardContainer, DashboardPage } from "./primitives";

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
        label: "Patients",
        href: "/dashboard/profile",
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
    title: "Lab tests and Screenings",
    items: [
      {
        label: "Add new screening",
        href: "/dashboard/lab-test-interpretation",
        icon: <Plus className="size-4" />,
      },
      {
        label: "Previous Tests",
        href: "/dashboard/lab-test-interpretation",
        icon: <FileText className="size-4" />,
      },
      {
        label: "Biomakers Overview",
        href: "/dashboard/lab-test-interpretation",
        icon: <FlaskConical className="size-4" />,
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

export function getProfessionalPatients(
  profile: DashboardProfile,
): ProfessionalPatient[] {
  const primaryPatient: ProfessionalPatient = {
    id: slugifyPatientId(
      getProfileName(profile),
      profile.age || "23",
      getProfileSex(profile),
    ),
    name: getProfileName(profile),
    age: profile.age || "23",
    sex: getProfileSex(profile),
  };

  const defaults: ProfessionalPatient[] = [
    { id: "christine-23-female", name: "Christine", age: "23", sex: "Female" },
    { id: "joe-20-male", name: "Joe", age: "20", sex: "Male" },
    { id: "sara-31-female", name: "Sara", age: "31", sex: "Female" },
    { id: "abel-37-male", name: "Abel", age: "37", sex: "Male" },
  ];

  const uniquePatients = new Map<string, ProfessionalPatient>();
  [primaryPatient, ...defaults].forEach((patient) => {
    uniquePatients.set(patient.id, patient);
  });

  return Array.from(uniquePatients.values());
}

export function getProfessionalPatient(
  profile: DashboardProfile,
  patientId?: string | null,
) {
  const patients = getProfessionalPatients(profile);
  return (
    patients.find((patient) => patient.id === patientId) ??
    patients[0]
  );
}

export function formatProfessionalPatient(patient: ProfessionalPatient) {
  return `${patient.name} ${patient.age} y.o ${patient.sex}`;
}

export function formatProfessionalPatientCompact(patient: ProfessionalPatient) {
  return `${patient.name} - ${patient.age} y.o ${patient.sex}`;
}

export function ProfessionalDashboardShell({
  children,
  contentClassName,
}: {
  profile: DashboardProfile;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <DashboardPage>
      <DashboardContainer className="max-w-screen-2xl px-6 sm:px-8 xl:px-10">
        <div className="grid gap-6 xl:grid-cols-[180px_minmax(0,1fr)] xl:gap-8">
          <aside className="pt-8">
            <div className="sticky top-24">
              <div className="space-y-9">
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
        <p className="px-1 text-[13px] font-medium text-muted-foreground/80">
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
                "group flex items-center gap-2.5 rounded-lg px-1 py-1 text-[15px] transition-colors",
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

function slugifyPatientId(name: string, age: string, sex: string) {
  return `${name}-${age}-${sex}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
