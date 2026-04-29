"use client";

import { useEffect, useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import {
  dispatchMeRefresh,
  patchAiDoctorSetup,
  userFacingMeError,
} from "@/lib/me-api";
import { useAIDoctorConfig } from "@/lib/hooks/use-app-config";
import { cn } from "@/lib/utils";

import {
  DashboardActionButton,
  DashboardContainer,
  DashboardPage,
} from "./primitives";
import { ChatOptionsPage } from "./chat-pages";
import { useAIDoctorSetupStatus } from "./use-ai-doctor-setup";
import { useDashboardProfile } from "./use-dashboard-profile";

type Choice = "yes" | "no" | null;

type StepAnswer = {
  choice: Choice;
  selections: string[];
  details: string;
  selectedOption: string;
};

type AnswersState = Record<string, StepAnswer>;

export function AIDoctorEntryPage() {
  const searchParams = useSearchParams();
  const { hasResolved, isSetupComplete } = useAIDoctorSetupStatus();
  const skipSetup = searchParams.get("skipSetup") === "1";

  if (!hasResolved) {
    return (
      <DashboardPage>
        <DashboardContainer>
          <section className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
            <LoaderCircle className="size-8 animate-spin text-primary" />
          </section>
        </DashboardContainer>
      </DashboardPage>
    );
  }

  if (!isSetupComplete && !skipSetup) {
    return <AIDoctorSetupPage />;
  }

  return <ChatOptionsPage />;
}

export function AIDoctorSetupPage() {
  const router = useRouter();
  const { data: config } = useAIDoctorConfig();
  const { hasResolved, isSetupComplete } = useAIDoctorSetupStatus();
  const profile = useDashboardProfile();
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [serverSetupError, setServerSetupError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasResolved || !isSetupComplete) return;

    router.replace("/dashboard/ai-doctor");
  }, [hasResolved, isSetupComplete, router]);

  useEffect(() => {
    if (!completed) return;
    let cancelled = false;
    let timeoutId: number | undefined;
    (async () => {
      setServerSetupError(null);
      try {
        await patchAiDoctorSetup(true);
        dispatchMeRefresh();
        if (cancelled) return;
        timeoutId = window.setTimeout(() => {
          router.push("/dashboard/ai-doctor");
        }, 1800);
      } catch (e) {
        console.error(e);
        try {
          window.localStorage.setItem("mediai-ai-doctor-setup-completed", "true");
        } catch {
          /* ignore */
        }
        if (!cancelled) {
          setServerSetupError(
            userFacingMeError(
              e,
              "Could not save your setup to your account. A copy is saved on this device only; try again when you are online.",
            ),
          );
        }
      }
    })();
    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [completed, router]);

  return (
    <DashboardPage>
      <DashboardContainer>
        {!hasResolved ? (
          <section className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
            <LoaderCircle className="size-8 animate-spin text-primary" />
          </section>
        ) : null}

        {hasResolved && !isSetupComplete
          ? completed
            ? (
                <MedicalHistorySuccess
                  name={profile.preferredName || "Joe"}
                  totalSteps={config.medicalHistoryTotalSteps}
                  serverError={serverSetupError}
                  onContinueLocal={() => router.push("/dashboard/ai-doctor")}
                />
              )
            : started
              ? (
                  <MedicalHistoryWizard
                    medicalHistorySteps={config.medicalHistorySteps}
                    medicalHistoryTotalSteps={config.medicalHistoryTotalSteps}
                    onComplete={() => setCompleted(true)}
                    onSaveAndExit={() => router.push("/dashboard")}
                  />
                )
              : (
                  <AIDoctorIntro
                    aiDoctorBenefits={config.aiDoctorBenefits}
                    onStart={() => setStarted(true)}
                  />
                )
          : null}
      </DashboardContainer>
    </DashboardPage>
  );
}

function AIDoctorIntro({
  aiDoctorBenefits,
  onStart,
}: {
  aiDoctorBenefits: string[];
  onStart: () => void;
}) {
  return (
    <section className="flex min-h-[calc(100vh-12rem)] items-center">
      <div className="grid w-full gap-10 lg:grid-cols-[220px_1fr] lg:items-center">
        <div className="flex justify-center lg:justify-start">
          <DoctorOrb />
        </div>

        <div className="max-w-2xl space-y-7">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Personalize Your AI Doctor
            </h1>
            <p className="text-base text-muted-foreground">
              Get answers to all your health questions
            </p>
          </div>

          <ul className="space-y-3">
            {aiDoctorBenefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-base">
                <CheckCircle2 className="size-5 text-primary" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col items-start gap-4 pt-2">
            <DashboardActionButton onClick={onStart}>
              Complete Health Profile
            </DashboardActionButton>
            <Link
              href="/dashboard/ai-doctor?skipSetup=1"
              className="pl-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Skip for Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function MedicalHistoryWizard({
  medicalHistorySteps,
  medicalHistoryTotalSteps,
  onComplete,
  onSaveAndExit,
}: {
  medicalHistorySteps: {
    id: string;
    title: string;
    description: string;
    sectionTitle?: string;
    stepKind: "yes-no-checklist" | "yes-no-text" | "choice-list";
    placeholder?: string;
    options?: string[];
    choiceOptions?: { label: string; description?: string }[];
  }[];
  medicalHistoryTotalSteps: number;
  onComplete: () => void;
  onSaveAndExit: () => void;
}) {
  const defaultAnswers = useMemo(
    () =>
      medicalHistorySteps.reduce<AnswersState>((acc, step) => {
        acc[step.id] = {
          choice: null,
          selections: [],
          details: "",
          selectedOption: "",
        };
        return acc;
      }, {}),
    [medicalHistorySteps],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersState>(defaultAnswers);

  const step = medicalHistorySteps[stepIndex];
  const answer = answers[step.id];

  const canContinue = useMemo(() => {
    if (step.stepKind === "choice-list") {
      return answer.selectedOption.length > 0;
    }

    if (answer.choice === "no") return true;
    if (answer.choice === "yes") {
      if (step.stepKind === "yes-no-checklist") {
        return answer.selections.length > 0 || answer.details.trim().length > 0;
      }

      if (step.stepKind === "yes-no-text") {
        return answer.details.trim().length > 0;
      }
    }

    return false;
  }, [answer, step.stepKind]);

  function updateAnswer(next: Partial<StepAnswer>) {
    setAnswers((current) => ({
      ...current,
      [step.id]: {
        ...current[step.id],
        ...next,
      },
    }));
  }

  function setChoice(choice: Choice) {
    if (choice === "no") {
      updateAnswer({ choice, selections: [], details: "", selectedOption: "" });
      return;
    }

    updateAnswer({ choice });
  }

  function toggleSelection(option: string) {
    const exists = answer.selections.includes(option);

    updateAnswer({
      selections: exists
        ? answer.selections.filter((item) => item !== option)
        : [...answer.selections, option],
    });
  }

  function handleNext() {
    if (!canContinue) return;

    if (stepIndex === medicalHistorySteps.length - 1) {
      onComplete();
      return;
    }

    setStepIndex((current) => current + 1);
  }

  return (
    <section className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-8">
      <div className="w-full max-w-3xl space-y-8">
        <MedicalHistoryProgress
          currentStep={stepIndex + 1}
          sectionTitle={step.sectionTitle ?? "Medical History"}
          totalSteps={medicalHistoryTotalSteps}
        />

        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{step.title}</h2>
            {step.description ? (
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {step.description}
              </p>
            ) : null}
          </div>

          {step.stepKind === "choice-list" ? (
            <div className="space-y-3">
              {step.choiceOptions?.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => updateAnswer({ selectedOption: option.label })}
                  className={cn(
                    "w-full rounded-2xl border bg-primary px-5 py-4 text-left text-lg font-medium text-primary-foreground transition-all",
                    answer.selectedOption === option.label
                      ? "border-primary bg-primary/75 ring-2 ring-primary/15"
                      : "border-primary/10 hover:bg-primary/90",
                  )}
                >
                  <div className="space-y-1">
                    <p>{option.label}</p>
                    {option.description ? (
                      <p className="text-sm leading-5 text-primary-foreground/85">
                        {option.description}
                      </p>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <ChoiceButton
                  selected={answer.choice === "no"}
                  onClick={() => setChoice("no")}
                >
                  No
                </ChoiceButton>
                <ChoiceButton
                  selected={answer.choice === "yes"}
                  onClick={() => setChoice("yes")}
                >
                  Yes
                </ChoiceButton>
              </div>

              {answer.choice === "yes" && step.stepKind === "yes-no-checklist" && step.options ? (
                <div className="space-y-4">
                  {step.options.map((option) => (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-primary/20 bg-white px-4 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={answer.selections.includes(option)}
                        onChange={() => toggleSelection(option)}
                        className="size-4 rounded border-border text-primary"
                      />
                      <span className="text-base font-medium">{option}</span>
                    </label>
                  ))}

                  <input
                    value={answer.details}
                    onChange={(event) => updateAnswer({ details: event.target.value })}
                    placeholder={step.placeholder}
                    className="h-12 w-full rounded-2xl border border-primary/15 bg-white px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
              ) : null}

              {answer.choice === "yes" && step.stepKind === "yes-no-text" ? (
                <input
                  value={answer.details}
                  onChange={(event) => updateAnswer({ details: event.target.value })}
                  placeholder={step.placeholder}
                  className="h-12 w-full rounded-2xl border border-primary/15 bg-white px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
              ) : null}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onSaveAndExit}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Save and Exit
          </button>

          <DashboardActionButton disabled={!canContinue} onClick={handleNext}>
            Next
          </DashboardActionButton>
        </div>
      </div>
    </section>
  );
}

function MedicalHistoryProgress({
  currentStep,
  sectionTitle,
  totalSteps,
}: {
  currentStep: number;
  sectionTitle: string;
  totalSteps: number;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3">
      <p className="text-sm font-medium text-foreground">{sectionTitle}</p>
      <div className="flex w-full items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full bg-muted",
              index < currentStep && "bg-primary",
            )}
          />
        ))}
        <span className="ml-3 text-sm font-medium text-foreground">
          {currentStep}/{totalSteps}
        </span>
      </div>
    </div>
  );
}

function ChoiceButton({
  children,
  selected,
  onClick,
}: {
  children: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-14 rounded-2xl border text-lg font-medium transition-all",
        selected
          ? "border-primary bg-primary/75 text-primary-foreground ring-2 ring-primary/15"
          : "border-primary/10 bg-primary text-primary-foreground hover:bg-primary/90",
      )}
    >
      {children}
    </button>
  );
}

function DoctorOrb() {
  return (
    <div className="relative flex size-24 items-center justify-center">
      <Image src="/bot-logo.png" alt="Doctor Bot" width={96} height={96} className="object-contain" />
    </div>
  );
}

function MedicalHistorySuccess({
  name,
  totalSteps,
  serverError,
  onContinueLocal,
}: {
  name: string;
  totalSteps: number;
  serverError: string | null;
  onContinueLocal: () => void;
}) {
  return (
    <section className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-8">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {serverError ? (
          <div
            className="mx-auto max-w-lg rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-left text-sm text-destructive"
            role="alert"
          >
            <p className="font-medium">Couldn&apos;t sync to the server</p>
            <p className="mt-1 text-destructive/90">{serverError}</p>
            <p className="mt-2 text-destructive/80">
              Your answers are stored on this device only until sync succeeds. You can
              still open the AI Doctor below.
            </p>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={onContinueLocal}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95"
              >
                Continue to AI Doctor
              </button>
            </div>
          </div>
        ) : null}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            🎉 Great, {name}!
          </h1>
          <div className="mx-auto max-w-md">
            <MedicalHistoryProgress
              currentStep={totalSteps}
              sectionTitle="Life Patterns & Habits"
              totalSteps={totalSteps}
            />
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-lg font-medium">
            You have successfully answered all questions!
          </p>
          {!serverError ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <LoaderCircle className="size-10 animate-spin text-primary" />
              <p className="text-base">Creating {name}&rsquo;s Health profile...</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
