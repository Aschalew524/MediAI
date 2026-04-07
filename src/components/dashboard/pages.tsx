"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  CircleCheck,
  FileText,
  Pencil,
  Plus,
  Stethoscope,
  TestTube2,
  Upload,
  UserRound,
  X,
} from "lucide-react";

import {
  getProfileHeight,
  getProfileName,
  getProfileSex,
  getProfileWeight,
} from "@/lib/dashboard-content";
import { useDashboardConfig } from "@/lib/hooks/use-app-config";
import { cn } from "@/lib/utils";

import {
  CompletionRing,
  CompletionBar,
  DashboardActionButton,
  DashboardBackTitle,
  DashboardContainer,
  DashboardListRow,
  DashboardPage,
  DashboardPanel,
  DashboardSectionHeader,
} from "./primitives";
import { useDashboardProfile } from "./use-dashboard-profile";

export function DashboardHomePage() {
  const profile = useDashboardProfile();
  const { data: config } = useDashboardConfig();
  const name = getProfileName(profile);

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-6">
        <DashboardPanel className="flex items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{name}&rsquo;s</h1>
            <p className="mt-1 text-sm text-muted-foreground">Health Profile</p>
          </div>
          <CompletionRing value={3} />
        </DashboardPanel>

        <div className="grid gap-5 md:grid-cols-2">
          {config.dashboardCards.map((card) => (
            <DashboardShortcutCard
              key={card.title + card.description}
              title={card.title}
              description={card.description}
              href={card.href}
              accent={card.accent}
              muted={"muted" in card ? card.muted : undefined}
            />
          ))}
        </div>

        <DashboardShortcutCard
          title={config.consultDoctorsCard.title}
          description={config.consultDoctorsCard.description}
          href={config.consultDoctorsCard.href}
          accent="doctors"
          wide
        />
      </DashboardContainer>
    </DashboardPage>
  );
}

function DashboardShortcutCard({
  title,
  description,
  href,
  accent,
  muted,
  wide,
}: {
  title: string;
  description: string;
  href: string;
  accent: "bot" | "lab" | "doctors";
  muted?: boolean;
  wide?: boolean;
}) {
  const cardContent = (
    <DashboardPanel
      className={cn(
        "group relative overflow-hidden px-6 py-5",
        wide && "min-h-32",
        !wide && "min-h-28",
      )}
    >
      <div className="relative z-10 flex min-h-24 flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h2 className="max-w-xs text-xl font-semibold leading-tight">
            {title}
          </h2>
          {description ? (
            <p className="max-w-md text-sm text-muted-foreground">
              {muted ? `○ ${description}` : description}
            </p>
          ) : null}
        </div>
        <VisualAccent accent={accent} />
      </div>
    </DashboardPanel>
  );

  if (href === "#") return cardContent;

  return (
    <Link href={href} className="block transition-transform hover:-translate-y-px">
      {cardContent}
    </Link>
  );
}

function VisualAccent({ accent }: { accent: "bot" | "lab" | "doctors" }) {
  if (accent === "bot") {
    return (
      <div className="relative flex size-20 items-center justify-center">
        <Image src="/bot-logo.png" alt="Bot Icon" width={80} height={80} className="object-contain" />
      </div>
    );
  }

  if (accent === "lab") {
    return (
      <div className="relative flex size-20 items-center justify-center">
        <div className="absolute inset-3 rounded-full bg-primary/8 blur-2xl" />
        <div className="rounded-2xl border border-primary/15 bg-white p-4 shadow-[0_20px_50px_-35px_rgba(76,104,220,0.7)]">
          <FileText className="size-8 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex size-24 items-center justify-center">
      <div className="absolute inset-2 rounded-full bg-primary/8 blur-3xl" />
      <div className="flex -space-x-3">
        <div className="flex size-14 items-center justify-center rounded-full border border-primary/10 bg-white shadow-[0_20px_50px_-35px_rgba(76,104,220,0.75)]">
          <UserRound className="size-6 text-primary/80" />
        </div>
        <div className="mt-4 flex size-14 items-center justify-center rounded-full border border-primary/10 bg-white shadow-[0_20px_50px_-35px_rgba(76,104,220,0.75)]">
          <Stethoscope className="size-6 text-primary/60" />
        </div>
      </div>
    </div>
  );
}

export function HealthProfilePage() {
  const profile = useDashboardProfile();

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <DashboardBackTitle
            title="Health Profile"
            description="Complete your health profile to get valuable insights into your health."
          />
          <CompletionBar value={3} label="Completed" />
        </div>

        <DashboardPanel className="space-y-4 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold">General Information</h2>
            <p className="mt-1 text-sm text-muted-foreground">Health Profile</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_180px_1fr] lg:items-center">
            <div className="space-y-4">
              <ProfileStat title="Age" value={`${profile.age || "55"} Years`} />
              <ProfileStat title="Height" value={getProfileHeight(profile)} />
            </div>

            <div className="flex justify-center">
              <div className="relative flex h-48 w-28 items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,rgba(111,139,255,0.08),transparent_70%)]">
                <div className="absolute top-5 h-10 w-10 rounded-full border-2 border-primary/40" />
                <div className="absolute top-14 h-20 w-8 rounded-[999px] border-x-2 border-primary/35" />
                <div className="absolute top-[4.6rem] h-1 w-20 bg-primary/25" />
                <div className="absolute top-[8.4rem] h-1 w-14 bg-primary/20" />
                <div className="absolute bottom-8 left-[2.7rem] h-16 w-px bg-primary/35" />
                <div className="absolute bottom-8 right-[2.7rem] h-16 w-px bg-primary/35" />
                <div className="absolute top-[3.8rem] left-[2.4rem] h-20 w-px bg-primary/25" />
                <div className="absolute top-[3.8rem] right-[2.4rem] h-20 w-px bg-primary/25" />
                <Activity className="size-24 text-primary/20" />
              </div>
            </div>

            <div className="space-y-4">
              <ProfileStat title="Weight" value={getProfileWeight(profile)} />
              <ProfileStat title="Sex Assigned at birth" value={getProfileSex(profile)} />
            </div>
          </div>
        </DashboardPanel>

        <Link href="/dashboard/profile/main-health-information" className="block transition-transform hover:-translate-y-px">
          <DashboardPanel className="flex items-center gap-4 px-6 py-5">
            <CompletionRing value={20} size="sm" />
            <h3 className="text-xl font-semibold">Main Health Information</h3>
          </DashboardPanel>
        </Link>

        <Link href="/dashboard/profile/lab-test-interpretation" className="block transition-transform hover:-translate-y-px">
          <DashboardPanel className="flex items-center gap-4 px-6 py-5">
            <CompletionRing value={0} size="sm" />
            <h3 className="text-xl font-semibold">Lab Test Interpretation</h3>
          </DashboardPanel>
        </Link>
      </DashboardContainer>
    </DashboardPage>
  );
}

function ProfileStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-primary/12 bg-background px-5 py-4">
      <div className="flex items-center gap-3 text-lg font-medium">
        <Pencil className="size-4 text-primary" />
        <span>{value}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

export function MainHealthInformationPage() {
  const { data: config } = useDashboardConfig();
  return (
    <DashboardPage>
      <DashboardContainer className="space-y-6">
        <DashboardBackTitle
          title="Main Health Information"
          description="Complete your main health information to personalize your AI Doctor, explore your health risks and get personal checkup plan."
        />

        <DashboardPanel className="px-6 py-4">
          {config.mainHealthInfoSections.map((section) => (
            <DashboardListRow key={section} title={section} />
          ))}
        </DashboardPanel>

        <div className="flex justify-center">
          <DashboardActionButton>Update Health Information</DashboardActionButton>
        </div>
      </DashboardContainer>
    </DashboardPage>
  );
}

export function LabTestInterpretationPage() {
  const { data: config } = useDashboardConfig();
  return (
    <DashboardPage>
      <DashboardContainer className="space-y-6">
        <DashboardBackTitle
          title="Lab Test Interpretation"
          description="Complete your main health information to personalize your AI Doctor, to explore your health risks and get personal checkup plan."
        />

        <DashboardPanel className="px-6 py-4">
          {config.labInterpretationCategories.map((category) => (
            <DashboardListRow
              key={category}
              title={category}
              trailing={<span className="text-base font-medium text-foreground">0</span>}
            />
          ))}
        </DashboardPanel>

        <div className="flex justify-center">
          <Link
            href="/dashboard/lab-tests"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-base font-medium text-primary-foreground transition-all hover:opacity-95"
          >
            Go To Lab Tests
          </Link>
        </div>
      </DashboardContainer>
    </DashboardPage>
  );
}

export function LabTestsPage() {
  const { data: config } = useDashboardConfig();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <DashboardPage>
        <DashboardContainer className="space-y-10">
          <DashboardPanel className="overflow-hidden px-6 py-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div className="space-y-6">
                <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/8">
                  <TestTube2 className="size-9 text-primary" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Lab Test and Screening Interpretations
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Turn medical tests to actionable insights.
                  </p>
                </div>

                <ul className="space-y-3">
                  {config.uploadHighlights.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-base text-foreground"
                    >
                      <CircleCheck className="size-5 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col items-center justify-center gap-5 py-8">
                <DashboardActionButton
                  className="inline-flex items-center gap-3"
                  onClick={() => setModalOpen(true)}
                >
                  <Plus className="size-5" />
                  Add New Test
                </DashboardActionButton>

                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Skip to My Dashboard
                </Link>
              </div>
            </div>
          </DashboardPanel>
        </DashboardContainer>
      </DashboardPage>

      {modalOpen ? <UploadMethodModal onClose={() => setModalOpen(false)} /> : null}
    </>
  );
}

function UploadMethodModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_35px_100px_-50px_rgba(0,0,0,0.45)]">
        <div className="flex justify-end">
          <button
            type="button"
            aria-label="Close upload method dialog"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-muted"
          >
            <X className="size-6" />
          </button>
        </div>

        <div className="space-y-4">
          <DashboardSectionHeader
            title="Choose how to upload your screening result"
            description="You can attach documents directly or enter details manually."
          />

          <div className="space-y-4 pt-2">
            <button
              type="button"
              className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-primary px-4 text-base font-medium text-primary-foreground transition-opacity hover:opacity-95"
            >
              <Upload className="size-5" />
              Upload File
            </button>
            <button
              type="button"
              className="flex h-14 w-full items-center justify-center rounded-xl border border-primary px-4 text-base font-medium text-foreground transition-colors hover:bg-muted"
            >
              Enter Manually
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
