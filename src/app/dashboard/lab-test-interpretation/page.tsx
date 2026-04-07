"use client";

import Link from "next/link";
import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  CheckCircle2,
  FlaskConical,
  Paperclip,
  Plus,
  Tag,
  X,
} from "lucide-react";

import {
  DashboardActionButton,
  DashboardContainer,
  DashboardPage,
  DashboardPanel,
} from "@/components/dashboard/primitives";
import { cn } from "@/lib/utils";

type Screen = "intro" | "manual" | "pricing";

const labTestTypes = [
  "Blood",
  "Urine",
  "Pap Smear",
  "Semen Analysis",
  "Stool Test",
  "Swab Test",
] as const;

const pricingPlans = [
  {
    name: "Free",
    badge: "Current Plan",
    monthly: "$0/Forever",
    yearly: "No credit card required",
    cta: "Current plan",
    mutedCta: true,
    features: [
      "3 messages/week with AI Doctor",
      "1 test result/month interpreted by AI",
      "AI long-term memory",
      "Conversation Summaries",
      "chat attachments",
      "Premium Support",
    ],
    includedCount: 5,
  },
  {
    name: "Lite",
    badge: "Popular",
    monthly: "$3.99/month",
    yearly: "Billed annually $47.88",
    cta: "Choose Plan",
    highlighted: true,
    features: [
      "50 messages/week with AI Doctor",
      "5 test result/month interpreted by AI",
      "AI long-term memory",
      "Conversation Summaries",
      "chat attachments",
      "Premium Support",
    ],
    includedCount: 6,
  },
  {
    name: "Pro",
    monthly: "$7.99/month",
    yearly: "Billed annually $95.88",
    cta: "Choose Plan",
    features: [
      "500 messages/week with AI Doctor",
      "15 test result/month interpreted by AI",
      "AI long-term memory",
      "Conversation Summaries",
      "chat attachments",
      "Premium Support",
    ],
    includedCount: 6,
  },
] as const;

export default function LabTestInterpretationPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [screen, setScreen] = useState<Screen>("intro");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");

  function openUploadChooser() {
    setModalOpen(true);
  }

  function closeUploadChooser() {
    setModalOpen(false);
  }

  function startManualFlow() {
    setModalOpen(false);
    setScreen("manual");
  }

  function startUploadFlow() {
    fileInputRef.current?.click();
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setModalOpen(false);
    setScreen("manual");
  }

  return (
    <DashboardPage className="min-h-[calc(100vh-4rem)]">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpeg,.jpg,.jfif,.webp"
        className="hidden"
        onChange={handleFileSelection}
      />

      <DashboardContainer
        className={cn(
          screen === "pricing"
            ? "max-w-5xl px-6"
            : "max-w-5xl px-6",
        )}
      >
        {screen === "intro" ? (
          <LabIntroScreen
            onAddNewTest={openUploadChooser}
            onSkip={() => router.push("/dashboard")}
          />
        ) : null}

        {screen === "manual" ? (
          <LabManualScreen
            selectedFileName={selectedFileName}
            onBack={() => setScreen("intro")}
            onNext={() => setScreen("pricing")}
          />
        ) : null}

        {screen === "pricing" ? (
          <LabPricingScreen
            onBack={() => setScreen("manual")}
            onChoosePlan={() => router.push("/pricing")}
            onGoToDashboard={() => router.push("/dashboard")}
          />
        ) : null}
      </DashboardContainer>

      {modalOpen ? (
        <UploadChooserModal
          onClose={closeUploadChooser}
          onUpload={startUploadFlow}
          onManual={startManualFlow}
        />
      ) : null}
    </DashboardPage>
  );
}

function LabIntroScreen({
  onAddNewTest,
  onSkip,
}: {
  onAddNewTest: () => void;
  onSkip: () => void;
}) {
  return (
    <section className="flex min-h-[calc(100vh-10rem)] items-center">
      <div className="w-full max-w-3xl space-y-10">
        <LabIllustration />

        <div className="space-y-3">
          <h1 className="text-[2.05rem] font-semibold tracking-tight text-foreground">
            Lab Test and Screening Interpretations
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Turn medical tests to actionable insights.
          </p>
        </div>

        <div className="space-y-4">
          {[
            "Upload your results",
            "Recieve detailed Interpretation",
            "Get Insights and Recommendations",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-[15px] font-medium">
              <CheckCircle2 className="size-4.5 text-primary" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start gap-4 pt-1">
          <DashboardActionButton
            type="button"
            className="h-12 gap-2 px-6 text-base"
            onClick={onAddNewTest}
          >
            <Plus className="size-4" />
            Add New Test
          </DashboardActionButton>

          <button
            type="button"
            onClick={onSkip}
            className="pl-2 text-sm font-medium text-primary underline underline-offset-2"
          >
            Skip to My Dashboard
          </button>
        </div>
      </div>
    </section>
  );
}

function LabManualScreen({
  selectedFileName,
  onBack,
  onNext,
}: {
  selectedFileName: string;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <section className="space-y-8 py-8">
      <div className="space-y-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          <span>Back</span>
        </button>

        <div className="space-y-1.5">
          <h1 className="text-[2rem] font-semibold tracking-tight text-foreground">
            Lab Test Interpretation
          </h1>
          <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
            Complete your main health information to personalize your AI Doctor,
            to explore your health risks and get personal checkup plan.
          </p>
          {selectedFileName ? (
            <p className="text-sm font-medium text-primary">
              Selected file: {selectedFileName}
            </p>
          ) : null}
        </div>
      </div>

      <DashboardPanel className="overflow-hidden rounded-[18px] border-primary/20 px-7 py-4 shadow-none">
        {labTestTypes.map((test, index) => (
          <div
            key={test}
            className={cn(
              "flex items-center justify-between gap-4 py-6",
              index < labTestTypes.length - 1 && "border-b border-primary/10",
            )}
          >
            <span className="text-[15px] font-medium text-foreground">{test}</span>
            <span className="text-[15px] text-muted-foreground">0</span>
          </div>
        ))}
      </DashboardPanel>

      <div className="flex justify-center pt-2">
        <DashboardActionButton
          type="button"
          className="h-12 rounded-xl px-8 text-base"
          onClick={onNext}
        >
          Go To Lab Tests
        </DashboardActionButton>
      </div>
    </section>
  );
}

function LabPricingScreen({
  onBack,
  onChoosePlan,
  onGoToDashboard,
}: {
  onBack: () => void;
  onChoosePlan: () => void;
  onGoToDashboard: () => void;
}) {
  return (
    <section className="space-y-9 py-8">
      <div className="flex justify-center">
        <Link href="/" className="text-[2.1rem] font-bold tracking-tight">
          <span className="text-[#5B86F7]">Medi</span>
          <span className="text-foreground">AI</span>
        </Link>
      </div>

      <div className="space-y-7">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          <span>Plans and Pricing</span>
        </button>

        <div className="flex items-center justify-center gap-2 text-sm text-foreground/80">
          <Tag className="size-4 text-primary" />
          <span>Save up to 50% with Yearly!</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <PricingCard
              key={plan.name}
              {...plan}
              onClick={plan.mutedCta ? onGoToDashboard : onChoosePlan}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function UploadChooserModal({
  onClose,
  onUpload,
  onManual,
}: {
  onClose: () => void;
  onUpload: () => void;
  onManual: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[270px] rounded-sm bg-white px-4 py-5 shadow-[0_20px_70px_-30px_rgba(0,0,0,0.55)]">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            aria-label="Close upload chooser"
            onClick={onClose}
            className="text-primary transition-opacity hover:opacity-80"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-2">
          <h2 className="text-[1rem] font-semibold leading-6 text-foreground">
            Choose how to upload your screening result
          </h2>
          <p className="text-sm leading-5 text-muted-foreground">
            You can attach documents directly or enter details manually
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={onUpload}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95"
          >
            <Paperclip className="size-4" />
            Upload File
          </button>

          <button
            type="button"
            onClick={onManual}
            className="flex h-10 w-full items-center justify-center rounded-md border border-primary text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Enter Manually
          </button>
        </div>
      </div>
    </div>
  );
}

function LabIllustration() {
  return (
    <div className="relative flex h-36 w-36 items-center justify-center rounded-[2rem] bg-primary/6">
      <div className="absolute inset-4 rounded-[1.75rem] bg-primary/8 blur-2xl" />
      <div className="relative rounded-[1.35rem] border border-primary/15 bg-white p-5 shadow-[0_20px_60px_-35px_rgba(76,104,220,0.65)]">
        <div className="relative">
          <div className="absolute -left-4 -top-3 h-14 w-12 rounded-full bg-primary/8 blur-xl" />
          <div className="flex h-20 w-16 flex-col gap-2 rounded-xl border border-primary/20 px-2 py-2">
            <div className="h-1.5 rounded-full bg-primary/80" />
            <div className="h-1.5 rounded-full bg-primary/35" />
            <div className="mt-1 flex flex-1 items-center justify-center rounded-lg bg-primary/6">
              <FlaskConical className="size-6 text-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  name,
  badge,
  monthly,
  yearly,
  cta,
  features,
  includedCount,
  highlighted,
  mutedCta,
  onClick,
}: {
  name: string;
  badge?: string;
  monthly: string;
  yearly: string;
  cta: string;
  features: readonly string[];
  includedCount: number;
  highlighted?: boolean;
  mutedCta?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/35 bg-white px-4 py-4",
        highlighted && "bg-primary/10",
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-[1.65rem] font-semibold tracking-tight">{name}</h2>
          {badge ? (
            <span className="rounded-full border border-primary/35 px-2 py-0.5 text-[11px] font-medium text-primary">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="text-[1.05rem] font-semibold text-foreground">{monthly}</p>
        <p className="text-xs text-muted-foreground">{yearly}</p>
      </div>

      <button
        type="button"
        onClick={onClick}
        className={cn(
          "mt-4 flex h-10 w-full items-center justify-center rounded-md text-sm font-medium transition-colors",
          mutedCta
            ? "border border-border bg-white text-muted-foreground"
            : "bg-primary text-primary-foreground hover:opacity-95",
        )}
      >
        {cta}
      </button>

      <div className="mt-5 space-y-2.5">
        {features.map((feature, index) => {
          const included = index < includedCount;

          return (
            <div key={feature} className="flex items-start gap-2.5 text-sm">
              <span
                className={cn(
                  "mt-0.5 inline-flex size-4 items-center justify-center rounded-full text-[10px] font-semibold",
                  included
                    ? "text-primary"
                    : "text-primary/70",
                )}
              >
                {included ? "✓" : "×"}
              </span>
              <span className={included ? "text-foreground" : "text-foreground/85"}>
                {feature}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
