"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {
  BadgeInfo,
  Check,
  ChevronDown,
  Lock,
  MapPinned,
  MoveRight,
  UserRound,
  Waves,
} from "lucide-react";

import {
  type FeatureOption,
  type MeasurementSystemOption,
  type SexOption,
  type UserRoleOption,
} from "@/lib/onboarding-content";
import { dashboardProfileStorageKey } from "@/lib/dashboard-content";
import { useOnboardingConfig } from "@/lib/hooks/use-app-config";
import { cn } from "@/lib/utils";

import {
  BrandMark,
  OnboardingCard,
  OnboardingShell,
  OptionCard,
  PrimaryButton,
  ProgressHeader,
  SecondaryButton,
  StepNotice,
  StepTitle,
} from "./primitives";

type UserRole = UserRoleOption["id"] | null;
type MeasurementSystem = MeasurementSystemOption["id"] | null;
type SexAtBirth = SexOption["id"] | null;
type PreferredFeature = FeatureOption["id"] | null;

const onboardingStepCount = 8;
const firstGeneralInfoStep = 4;

type OnboardingState = {
  role: UserRole;
  preferredName: string;
  isConfirmedAdult: boolean;
  region: string;
  age: string;
  measurementSystem: MeasurementSystem;
  weight: string;
  heightFeet: string;
  heightInches: string;
  heightCm: string;
  sexAtBirth: SexAtBirth;
  preferredFeature: PreferredFeature;
};

export function OnboardingWizard() {
  const router = useRouter();
  const { data: config } = useOnboardingConfig();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<OnboardingState>({
    role: null,
    preferredName: "",
    isConfirmedAdult: false,
    region: "",
    age: "",
    measurementSystem: "imperial",
    weight: "",
    heightFeet: "",
    heightInches: "",
    heightCm: "",
    sexAtBirth: null,
    preferredFeature: null,
  });

  const currentLabel =
    currentStep >= firstGeneralInfoStep && currentStep <= 6
      ? config.onboardingStepLabels[firstGeneralInfoStep]
      : config.onboardingStepLabels[currentStep] ?? "Onboarding";
  const generalInfoProgressIndex = currentStep - firstGeneralInfoStep;

  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 0:
        return Boolean(form.role);
      case 1:
        return form.preferredName.trim().length > 0 && form.isConfirmedAdult;
      case 2:
        return Boolean(form.region);
      case 3:
        return true;
      case 4:
        return Number(form.age) > 0;
      case 5:
        if (form.measurementSystem === "metric") {
          return Number(form.weight) > 0 && Number(form.heightCm) > 0;
        }

        return (
          Number(form.weight) > 0 &&
          Number(form.heightFeet) > 0 &&
          Number(form.heightInches) >= 0
        );
      case 6:
        return Boolean(form.sexAtBirth);
      case 7:
        return Boolean(form.preferredFeature);
      default:
        return false;
    }
  }, [currentStep, form]);

  const continueLabel =
    currentStep === onboardingStepCount - 1 ? "Next" : "Continue";

  function completeOnboarding() {
    const payload = {
      preferredName: form.preferredName,
      age: form.age,
      region: form.region,
      measurementSystem: form.measurementSystem ?? "imperial",
      weight: form.weight,
      heightFeet: form.heightFeet,
      heightInches: form.heightInches,
      heightCm: form.heightCm,
      sexAtBirth: form.sexAtBirth,
      preferredFeature: form.preferredFeature,
    };

    window.localStorage.setItem(
      dashboardProfileStorageKey,
      JSON.stringify(payload),
    );

    if (form.preferredFeature === "lab-interpretation") {
      router.push("/dashboard/lab-tests");
      return;
    }

    if (form.preferredFeature === "ai-doctor") {
      router.push("/dashboard/ai-doctor");
      return;
    }

    if (form.preferredFeature === "top-doctors") {
      router.push("/dashboard/top-doctors");
      return;
    }

    router.push("/dashboard");
  }

  function nextStep() {
    if (!isStepValid) return;

    if (currentStep === onboardingStepCount - 1) {
      completeOnboarding();
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, onboardingStepCount - 1));
  }

  function previousStep() {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  return (
    <OnboardingShell>
      <BrandMark />

      {currentStep === 0 ? (
        <OnboardingCard className="max-w-4xl">
          <div className="space-y-10">
            <StepTitle
              title="Hello"
              description="How do you plan to use MediAI?"
            />

            <div className="grid gap-5 md:grid-cols-2">
              {config.userRoleOptions.map((option) => (
                <OptionCard
                  key={option.id}
                  title={option.title}
                  description={option.description}
                  selected={form.role === option.id}
                  onClick={() =>
                    setForm((current) => ({ ...current, role: option.id }))
                  }
                />
              ))}
            </div>

            <StepNotice>
              Please choose carefully, as it cannot be changed later.
            </StepNotice>

            <div className="flex justify-center">
              <PrimaryButton disabled={!isStepValid} onClick={nextStep}>
                {continueLabel}
              </PrimaryButton>
            </div>
          </div>
        </OnboardingCard>
      ) : null}

      {currentStep === 1 ? (
        <OnboardingCard>
          <div className="space-y-8">
            <StepTitle
              title="How Should We Greet You?"
              description="If privacy is a concern, feel free to use just a nickname."
              align="center"
            />

            <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
              <label className="space-y-2">
                <span className="sr-only">Preferred name</span>
                <input
                  value={form.preferredName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      preferredName: event.target.value,
                    }))
                  }
                  placeholder="Preferred nickname or name"
                  className="h-12 w-full rounded-xl border border-input bg-white px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
              </label>

              <label className="flex items-start gap-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.isConfirmedAdult}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isConfirmedAdult: event.target.checked,
                    }))
                  }
                  className="mt-1 size-4 rounded border-border text-primary"
                />
                <span>
                  I confirm that I am at least 18 years old or I am the legal
                  guardian of the user.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-center gap-3">
              <SecondaryButton onClick={previousStep}>Back</SecondaryButton>
              <PrimaryButton disabled={!isStepValid} onClick={nextStep}>
                {continueLabel}
              </PrimaryButton>
            </div>
          </div>
        </OnboardingCard>
      ) : null}

      {currentStep === 2 ? (
        <OnboardingCard className="max-w-4xl">
          <div className="space-y-8">
            <div className="mx-auto flex size-24 items-center justify-center rounded-full border border-primary/10 bg-primary/5">
              <MapPinned className="size-12 text-primary/70" />
            </div>

            <div className="mx-auto max-w-2xl space-y-4 text-center">
              <StepTitle
                title="In which part of Ethiopia do you live?"
                description="Selecting region helps us tailor our services and ensure compliance with local regulations."
                align="center"
              />
            </div>

            <div className="mx-auto w-full max-w-2xl space-y-5">
              <div className="relative">
                <select
                  value={form.region}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      region: event.target.value,
                    }))
                  }
                  className="h-12 w-full appearance-none rounded-xl border border-input bg-white px-4 pr-10 text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  <option value="">Select your Region</option>
                  {config.ethiopianRegions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              </div>

              <div className="flex items-center justify-center gap-3">
                <SecondaryButton onClick={previousStep}>Back</SecondaryButton>
                <PrimaryButton disabled={!isStepValid} onClick={nextStep}>
                  {continueLabel}
                </PrimaryButton>
              </div>
            </div>
          </div>
        </OnboardingCard>
      ) : null}

      {currentStep === 3 ? (
        <OnboardingCard className="max-w-4xl">
          <div className="space-y-8 text-center">
            <StepTitle
              title={
                form.preferredName.trim()
                  ? `Welcome to MediAI, ${form.preferredName.trim()}`
                  : "Welcome to MediAI"
              }
              description="Your personal health companion"
              align="center"
            />



            <p className="mx-auto max-w-3xl text-base leading-7 text-muted-foreground">
              We&apos;re going to ask you some health related questions to
              personalize your health journey for your unique needs.
            </p>

            <div className="mx-auto max-w-2xl rounded-2xl bg-muted px-5 py-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-3">
                <Lock className="size-4 text-foreground" />
                <span>
                  Privacy Note: Your data is confidential and secured by HIPAA
                  and GDPR standards.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <SecondaryButton onClick={previousStep}>Back</SecondaryButton>
              <PrimaryButton onClick={nextStep}>Start</PrimaryButton>
            </div>
          </div>
        </OnboardingCard>
      ) : null}

      {currentStep === 4 ? (
        <OnboardingCard className="max-w-3xl">
          <div className="space-y-10">
            <ProgressHeader
              title={currentLabel}
              currentStep={generalInfoProgressIndex}
              totalSteps={config.generalInformationSteps.length}
            />

            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Age</h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Age is a key factor in health assessment, influencing the
                  range of potential risks and appropriate wellness strategies.
                </p>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={form.age}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      age: event.target.value,
                    }))
                  }
                  placeholder="e.g. 48"
                  className="h-12 w-full rounded-xl border border-input bg-white px-4 pr-16 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  Years
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/6 px-3 py-1.5 text-primary">
                  <UserRound className="size-4" />
                  <span>{form.preferredName || "New user"}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/6 px-3 py-1.5 text-primary">
                  <Check className="size-4" />
                  <span>{form.region}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <SecondaryButton onClick={previousStep}>Back</SecondaryButton>
                <PrimaryButton disabled={!isStepValid} onClick={nextStep}>
                  <span className="inline-flex items-center gap-2">
                    Next
                    <MoveRight className="size-4" />
                  </span>
                </PrimaryButton>
              </div>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <BadgeInfo className="size-4 text-primary" />
                <span>
                  We use this profile information to personalize your guidance
                  and tailor the onboarding journey to your needs.
                </span>
              </div>
            </div>
          </div>
        </OnboardingCard>
      ) : null}

      {currentStep === 5 ? (
        <OnboardingCard className="max-w-3xl">
          <div className="space-y-10">
            <ProgressHeader
              title={currentLabel}
              currentStep={generalInfoProgressIndex}
              totalSteps={config.generalInformationSteps.length}
            />

            <div className="space-y-7">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Measurement system</h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Select your preferred measurement system to accurately record
                  your height and weight.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {config.measurementSystemOptions.map((option) => (
                  <OptionCard
                    key={option.id}
                    title={option.title}
                    description=""
                    selected={form.measurementSystem === option.id}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        measurementSystem: option.id,
                      }))
                    }
                    className="min-h-0 py-5 text-center"
                  />
                ))}
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="weight"
                    className="block text-sm font-medium text-foreground"
                  >
                    Weight
                  </label>
                  <div className="relative">
                    <input
                      id="weight"
                      type="number"
                      min="0"
                      inputMode="decimal"
                      value={form.weight}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          weight: event.target.value,
                        }))
                      }
                      placeholder={
                        form.measurementSystem === "metric" ? "e.g. 70" : "e.g. 155"
                      }
                      className="h-12 w-full rounded-xl border border-input bg-white px-4 pr-16 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                      {form.measurementSystem === "metric" ? "kg" : "lb"}
                    </span>
                  </div>
                </div>

                {form.measurementSystem === "metric" ? (
                  <div className="space-y-2">
                    <label
                      htmlFor="height-cm"
                      className="block text-sm font-medium text-foreground"
                    >
                      Height
                    </label>
                    <div className="relative">
                      <input
                        id="height-cm"
                        type="number"
                        min="0"
                        inputMode="decimal"
                        value={form.heightCm}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            heightCm: event.target.value,
                          }))
                        }
                        placeholder="e.g. 170"
                        className="h-12 w-full rounded-xl border border-input bg-white px-4 pr-16 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        cm
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Height
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={form.heightFeet}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              heightFeet: event.target.value,
                            }))
                          }
                          placeholder="e.g. 5"
                          className="h-12 w-full rounded-xl border border-input bg-white px-4 pr-12 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                          ft
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={form.heightInches}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              heightInches: event.target.value,
                            }))
                          }
                          placeholder="e.g. 6"
                          className="h-12 w-full rounded-xl border border-input bg-white px-4 pr-12 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                          in
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <SecondaryButton onClick={previousStep}>Back</SecondaryButton>
              <PrimaryButton disabled={!isStepValid} onClick={nextStep}>
                Next
              </PrimaryButton>
            </div>
          </div>
        </OnboardingCard>
      ) : null}

      {currentStep === 6 ? (
        <OnboardingCard className="max-w-3xl">
          <div className="space-y-10">
            <ProgressHeader
              title={currentLabel}
              currentStep={generalInfoProgressIndex}
              totalSteps={config.generalInformationSteps.length}
            />

            <div className="space-y-7">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Sex assigned at birth</h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Biological sex can impact risk for certain conditions and
                  response to treatments.
                </p>
              </div>

              <div className="space-y-3">
                {config.sexOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        sexAtBirth: option.id,
                      }))
                    }
                    className={cn(
                      "w-full rounded-xl border bg-primary px-5 py-4 text-left text-base font-medium text-primary-foreground transition-all hover:bg-primary/90",
                      form.sexAtBirth === option.id &&
                        "ring-2 ring-primary/15 border-primary bg-primary/80",
                      form.sexAtBirth !== option.id && "border-primary/10",
                    )}
                  >
                    {option.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <SecondaryButton onClick={previousStep}>Back</SecondaryButton>
              <PrimaryButton disabled={!isStepValid} onClick={nextStep}>
                Next
              </PrimaryButton>
            </div>
          </div>
        </OnboardingCard>
      ) : null}

      {currentStep === 7 ? (
        <OnboardingCard className="max-w-3xl">
          <div className="space-y-8">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                👌 {form.preferredName || "Friend"}, your general information is
                set!
              </p>
              <h2 className="text-xl font-semibold">
                Which MediAI feature would you like to explore first?
              </h2>
            </div>

            <div className="space-y-4">
              {config.featureOptions.map((option) => (
                <OptionCard
                  key={option.id}
                  title={option.title}
                  description={option.description}
                  selected={form.preferredFeature === option.id}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      preferredFeature: option.id,
                    }))
                  }
                  className="min-h-0 max-w-none"
                />
              ))}
            </div>

            <div className="flex flex-col items-center gap-4">
              <PrimaryButton disabled={!isStepValid} onClick={nextStep}>
                Next
              </PrimaryButton>

              <button
                type="button"
                onClick={completeOnboarding}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Skip to My Dashboard
              </button>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <Waves className="size-4 text-primary" />
                <span>
                  Your selection can be used to personalize the first experience
                  after onboarding.
                </span>
              </div>
            </div>
          </div>
        </OnboardingCard>
      ) : null}
    </OnboardingShell>
  );
}
