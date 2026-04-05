"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import { useAIDoctorConfig } from "@/lib/hooks/use-app-config";
import { cn } from "@/lib/utils";

import {
  DashboardActionButton,
  DashboardContainer,
  DashboardPage,
} from "./primitives";
import { useDashboardProfile } from "./use-dashboard-profile";

type Choice = "yes" | "no" | null;

type StepAnswer = {
  choice: Choice;
  selections: string[];
  details: string;
  selectedOption: string;
};

type AnswersState = Record<string, StepAnswer>;

export function AIDoctorSetupPage() {
  const router = useRouter();
  const { data: config } = useAIDoctorConfig();
  const profile = useDashboardProfile();
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!completed) return;

    const timeout = window.setTimeout(() => {
      router.push("/dashboard/ai-doctor");
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [completed, router]);

  return (
    <DashboardPage>
      <DashboardContainer>
        {completed ? (
          <MedicalHistorySuccess
            name={profile.preferredName || "Joe"}
            totalSteps={config.medicalHistoryTotalSteps}
          />
        ) : started ? (
          <MedicalHistoryWizard
            medicalHistorySteps={config.medicalHistorySteps}
            medicalHistoryTotalSteps={config.medicalHistoryTotalSteps}
            onComplete={() => setCompleted(true)}
            onSaveAndExit={() => router.push("/dashboard")}
          />
        ) : (
          <AIDoctorIntro
            aiDoctorBenefits={config.aiDoctorBenefits}
            onStart={() => setStarted(true)}
          />
        )}
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
          <div className="space-y-3">
            <h1 className="text-5xl font-semibold tracking-tight">
              Personalize Your AI Doctor
            </h1>
            <p className="text-lg text-muted-foreground">
              Get answers to all your health questions
            </p>
          </div>

          <ul className="space-y-4">
            {aiDoctorBenefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-lg">
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
              href="/dashboard/ai-doctor"
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

        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold">{step.title}</h2>
            {step.description ? (
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
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
                    "w-full rounded-2xl border bg-primary px-6 py-5 text-left text-xl font-medium text-primary-foreground transition-all",
                    answer.selectedOption === option.label
                      ? "border-primary bg-primary/75 ring-4 ring-primary/15"
                      : "border-primary/10 hover:bg-primary/90",
                  )}
                >
                  <div className="space-y-2">
                    <p>{option.label}</p>
                    {option.description ? (
                      <p className="text-sm leading-6 text-primary-foreground/85">
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
                      className="flex cursor-pointer items-center gap-4 rounded-2xl border border-primary/20 bg-white px-4 py-4"
                    >
                      <input
                        type="checkbox"
                        checked={answer.selections.includes(option)}
                        onChange={() => toggleSelection(option)}
                        className="size-5 rounded border-border text-primary"
                      />
                      <span className="text-lg font-medium">{option}</span>
                    </label>
                  ))}

                  <input
                    value={answer.details}
                    onChange={(event) => updateAnswer({ details: event.target.value })}
                    placeholder={step.placeholder}
                    className="h-14 w-full rounded-2xl border border-primary/15 bg-white px-4 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
              ) : null}

              {answer.choice === "yes" && step.stepKind === "yes-no-text" ? (
                <input
                  value={answer.details}
                  onChange={(event) => updateAnswer({ details: event.target.value })}
                  placeholder={step.placeholder}
                  className="h-14 w-full rounded-2xl border border-primary/15 bg-white px-4 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
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
        "h-18 rounded-2xl border text-xl font-medium transition-all",
        selected
          ? "border-primary bg-primary/75 text-primary-foreground ring-4 ring-primary/15"
          : "border-primary/10 bg-primary text-primary-foreground hover:bg-primary/90",
      )}
    >
      {children}
    </button>
  );
}

function DoctorOrb() {
  return (
    <div className="relative flex size-40 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,rgba(113,133,255,0.95),rgba(44,52,96,1)_72%)] shadow-[0_28px_58px_-24px_rgba(57,78,171,0.85)]">
      <div className="absolute inset-4 rounded-full border border-white/10" />
      <div className="flex w-20 items-center justify-center gap-3 rounded-full bg-[#10173A] px-3 py-2 shadow-inner">
        <span className="h-3 w-4 rounded-full bg-white shadow-[0_0_12px_rgba(120,140,255,0.95)]" />
        <span className="h-3 w-4 rounded-full bg-white shadow-[0_0_12px_rgba(120,140,255,0.95)]" />
      </div>
      <div className="absolute bottom-8 h-5 w-10 rounded-full bg-[#10173A] shadow-inner">
        <div className="mx-auto mt-1 h-2 w-4 rounded-full bg-white/95" />
      </div>
    </div>
  );
}

function MedicalHistorySuccess({
  name,
  totalSteps,
}: {
  name: string;
  totalSteps: number;
}) {
  return (
    <section className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-8">
      <div className="w-full max-w-3xl space-y-10 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl font-semibold tracking-tight">
            🎉 Great, {name}!
          </h1>
          <div className="mx-auto max-w-lg">
            <MedicalHistoryProgress
              currentStep={totalSteps}
              sectionTitle="Life Patterns & Habits"
              totalSteps={totalSteps}
            />
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-2xl font-medium">
            You have successfully answerd all questions!
          </p>
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <LoaderCircle className="size-14 animate-spin text-primary" />
            <p className="text-lg">Creating {name}&rsquo;s Health profile...</p>
          </div>
        </div>
      </div>
    </section>
  );
}
