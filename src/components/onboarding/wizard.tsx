"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import {
  BadgeInfo,
  Check,
  ChevronDown,
  Lock,
  MapPinned,
  MoveRight,
  UserRound,
} from "lucide-react";

import {
  type FeatureOption,
  type MeasurementSystemOption,
  type SexOption,
  type UserRoleOption,
  ethiopiaCharteredCities,
  ethiopiaRegionalStates,
} from "@/lib/onboarding-content";
import { dispatchMeRefresh, postOnboardingComplete, userFacingMeError } from "@/lib/me-api";
import { clearOnboardingDraft, loadOnboardingDraft, saveOnboardingDraft } from "@/lib/onboarding-draft";
import { buildPersonalOnboardingBody } from "@/lib/onboarding-payloads";
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
import { ProfessionalOnboardingFlow } from "./professional-flow";

type UserRole = UserRoleOption["id"] | null;
type MeasurementSystem = MeasurementSystemOption["id"] | null;
type SexAtBirth = SexOption["id"] | null;
type PreferredFeature = FeatureOption["id"] | null;

const onboardingStepCount = 8;
const firstGeneralInfoStep = 4;
const DRAFT_SAVE_DEBOUNCE_MS = 400;

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

const DEFAULT_FORM: OnboardingState = {
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
};

function formForRole(role: UserRole): OnboardingState {
  return { ...DEFAULT_FORM, role };
}

export function OnboardingWizard() {
  const router = useRouter();
  const { data: config } = useOnboardingConfig();
  const [currentStep, setCurrentStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<OnboardingState>(DEFAULT_FORM);

  const didRestoreRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore draft once on mount
  useEffect(() => {
    if (didRestoreRef.current) return;
    didRestoreRef.current = true;
    const draft = loadOnboardingDraft();
    if (!draft) return;
    const clampedStep = Math.max(0, Math.min(onboardingStepCount - 1, Math.floor(draft.currentStep)));
    setForm((cur) => {
      // If the user already started typing before restore, do not override.
      if (cur.role !== null) return cur;
      return {
        ...DEFAULT_FORM,
        ...draft.form,
      } satisfies OnboardingState;
    });
    setCurrentStep(clampedStep);
  }, []);

  // Save draft immediately when step changes (navigation is important)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!form.role) return;
    saveOnboardingDraft({
      v: 1,
      savedAt: new Date().toISOString(),
      currentStep,
      form: {
        role: form.role,
        preferredName: form.preferredName,
        isConfirmedAdult: form.isConfirmedAdult,
        region: form.region,
        age: form.age,
        measurementSystem: form.measurementSystem,
        weight: form.weight,
        heightFeet: form.heightFeet,
        heightInches: form.heightInches,
        heightCm: form.heightCm,
        sexAtBirth: form.sexAtBirth,
        preferredFeature: form.preferredFeature,
      },
    });
  }, [currentStep]);

  // Debounced save for form typing
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!form.role) return;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      saveOnboardingDraft({
        v: 1,
        savedAt: new Date().toISOString(),
        currentStep,
        form: {
          role: form.role,
          preferredName: form.preferredName,
          isConfirmedAdult: form.isConfirmedAdult,
          region: form.region,
          age: form.age,
          measurementSystem: form.measurementSystem,
          weight: form.weight,
          heightFeet: form.heightFeet,
          heightInches: form.heightInches,
          heightCm: form.heightCm,
          sexAtBirth: form.sexAtBirth,
          preferredFeature: form.preferredFeature,
        },
      });
    }, DRAFT_SAVE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form, currentStep]);

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
        // Sanity ranges to prevent obvious garbage input (final validation still happens in payload builder).
        if (form.measurementSystem === "metric") {
          const w = Number(form.weight);
          const h = Number(form.heightCm);
          return w >= 2 && w <= 500 && h >= 30 && h <= 250;
        }

        const w = Number(form.weight);
        const ft = Number(form.heightFeet);
        const inch = Number(form.heightInches);
        return (
          w >= 5 &&
          w <= 1100 &&
          ft >= 1 &&
          ft <= 8 &&
          inch >= 0 &&
          inch <= 11
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

  if (form.role === "professional" && currentStep > 0) {
    return (
      <OnboardingShell>
        <BrandMark />
        <ProfessionalOnboardingFlow
          config={config}
          onBackToRoleSelection={() => {
            setCurrentStep(0);
            setForm(formForRole("professional"));
          }}
        />
      </OnboardingShell>
    );
  }

  function routeAfterOnboarding(feature: NonNullable<PreferredFeature>) {
    if (feature === "ai-doctor") {
      router.push("/dashboard/ai-doctor");
      return;
    }
    if (feature === "top-doctors") {
      router.push("/dashboard/top-doctors");
      return;
    }
    if (feature === "lab-test-interpretation") {
      router.push("/dashboard/lab-test-interpretation");
      return;
    }
    router.push("/dashboard");
  }

  async function completeOnboarding() {
    setFormError(null);
    setIsSubmitting(true);
    try {
      const feature = form.preferredFeature ?? "ai-doctor";
      const body = buildPersonalOnboardingBody({
        role: "personal",
        preferredName: form.preferredName,
        isConfirmedAdult: form.isConfirmedAdult,
        region: form.region,
        age: form.age,
        measurementSystem: form.measurementSystem,
        weight: form.weight,
        heightFeet: form.heightFeet,
        heightInches: form.heightInches,
        heightCm: form.heightCm,
        sexAtBirth: form.sexAtBirth,
        preferredFeature: form.preferredFeature,
      });
      await postOnboardingComplete(body);
      clearOnboardingDraft();
      dispatchMeRefresh();
      routeAfterOnboarding(feature);
    } catch (err) {
      if (err instanceof Error && !isAxiosError(err)) {
        setFormError(err.message);
      } else {
        setFormError(
          userFacingMeError(err, "Could not save your profile. Please try again."),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function nextStep() {
    if (!isStepValid || isSubmitting) return;

    if (currentStep === onboardingStepCount - 1) {
      void completeOnboarding();
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
                  onClick={() => setForm(formForRole(option.id))}
                />
              ))}
            </div>

            <StepNotice>
              Please choose carefully, as it cannot be changed later.
            </StepNotice>

            <div className="flex justify-center">
              <PrimaryButton
                disabled={!isStepValid}
                onClick={() => {
                  if (form.role === "professional") {
                    setCurrentStep(1);
                    return;
                  }

                  nextStep();
                }}
              >
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
                  <optgroup label="Regional states">
                    {ethiopiaRegionalStates.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Chartered cities">
                    {ethiopiaCharteredCities.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </optgroup>
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
        <OnboardingCard className="max-w-4xl">
          <div className="mx-auto flex w-full max-w-[560px] flex-col items-center space-y-7">
            <div className="w-full space-y-2">
              <p className="text-xs font-medium leading-5 text-muted-foreground">
                👌 {form.preferredName || "Friend"} (Nickname), your general
                information is set!
              </p>
              <h2 className="text-2xl font-semibold leading-8 tracking-tight text-foreground sm:text-3xl">
                Which Docus AI feature would you like to explore first?
              </h2>
            </div>

            <div className="w-full space-y-4">
              {config.featureOptions.map((option) => {
                const selected = form.preferredFeature === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        preferredFeature: option.id,
                      }))
                    }
                    className={cn(
                      "w-full min-h-[4.5rem] rounded-[18px] border px-5 py-5 text-left text-primary-foreground shadow-[0_20px_50px_-34px_rgba(76,104,220,0.72)] transition-all sm:min-h-0 sm:px-8 sm:py-6",
                      "bg-primary hover:bg-primary/90",
                      selected
                        ? "border-white/85 bg-primary/70 ring-[3px] ring-[#dbe4ff]"
                        : "border-primary/10",
                    )}
                  >
                    <div className="max-w-[320px] space-y-2">
                      <h3 className="text-sm font-semibold leading-6 sm:text-base">
                        {option.title}
                      </h3>
                      <p className="text-xs leading-5 text-primary-foreground/80 sm:text-sm">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {formError ? (
              <p className="w-full text-center text-sm text-destructive" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="flex flex-col items-center gap-5 pt-2">
              <PrimaryButton
                className="h-11 min-w-24 rounded-xl px-7 text-sm font-medium"
                disabled={!isStepValid || isSubmitting}
                onClick={nextStep}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </span>
                ) : (
                  "Next"
                )}
              </PrimaryButton>

              <button
                type="button"
                onClick={() => {
                  void completeOnboarding();
                }}
                disabled={isSubmitting}
                className="text-sm font-medium text-primary underline underline-offset-2 hover:opacity-90 disabled:opacity-50"
              >
                Skip to My Dashboard
              </button>
            </div>
          </div>
        </OnboardingCard>
      ) : null}
    </OnboardingShell>
  );
}
