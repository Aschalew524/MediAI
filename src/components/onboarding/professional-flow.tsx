"use client";

import { useRef, useState, type ChangeEvent } from "react";

import { useRouter } from "next/navigation";

import {
  CheckCircle2,
  ChevronDown,
  HeartPulse,
  Lock,
  Mail,
  MapPinned,
  Plus,
  Stethoscope,
  Upload,
} from "lucide-react";

import {
  dashboardProfileStorageKey,
  defaultDashboardProfile,
} from "@/lib/dashboard-content";
import type {
  MeasurementSystemOption,
  ProfessionalTitleOption,
  SexOption,
} from "@/lib/onboarding-content";
import { cn } from "@/lib/utils";

import {
  OnboardingCard,
  OptionCard,
  PrimaryButton,
  ProgressHeader,
  SecondaryButton,
  StepNotice,
  StepTitle,
} from "./primitives";

type ProfessionalOnboardingConfig = {
  professionalTitleOptions: ProfessionalTitleOption[];
  professionalSpecialtyOptions: string[];
  professionalCompletionItems: string[];
  ethiopianRegions: string[];
  sexOptions: SexOption[];
  measurementSystemOptions: MeasurementSystemOption[];
  smokingIntensityOptions: string[];
  alcoholIntakeOptions: string[];
  physicalActivityOptions: string[];
  dietaryHabitOptions: string[];
  sleepPatternOptions: string[];
  stressLevelOptions: string[];
};

type ProfessionalOnboardingFlowProps = {
  config: ProfessionalOnboardingConfig;
  onBackToRoleSelection: () => void;
};

type ProfessionalFormState = {
  title: ProfessionalTitleOption["id"] | "";
  fullName: string;
  specialty: string;
  region: string;
  patientName: string;
  patientAge: string;
  patientSex: SexOption["id"] | "";
  invitePatient: boolean;
  patientEmail: string;
  patientHistory: string;
  attachedHistoryFileName: string;
  familyHistory: string;
  medicationsHistory: string;
  allergies: string;
  measurementSystem: MeasurementSystemOption["id"];
  weight: string;
  heightFeet: string;
  heightInches: string;
  heightCm: string;
  smokingIntensity: string;
  alcoholIntake: string;
  physicalActivity: string;
  dietaryHabits: string;
  sleepPattern: string;
  stressLevel: string;
};

const patientSetupSteps = [
  "Basic Details",
  "Health History",
  "Lifestyle and Habits",
] as const;

export function ProfessionalOnboardingFlow({
  config,
  onBackToRoleSelection,
}: ProfessionalOnboardingFlowProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedNotes, setExpandedNotes] = useState({
    familyHistory: false,
    medicationsHistory: false,
    allergies: false,
  });
  const [form, setForm] = useState<ProfessionalFormState>({
    title: "dr",
    fullName: "",
    specialty: "",
    region: "",
    patientName: "",
    patientAge: "",
    patientSex: "",
    invitePatient: false,
    patientEmail: "",
    patientHistory: "",
    attachedHistoryFileName: "",
    familyHistory: "",
    medicationsHistory: "",
    allergies: "",
    measurementSystem: "imperial",
    weight: "",
    heightFeet: "",
    heightInches: "",
    heightCm: "",
    smokingIntensity: "",
    alcoholIntake: "",
    physicalActivity: "",
    dietaryHabits: "",
    sleepPattern: "",
    stressLevel: "",
  });

  const selectedTitle =
    config.professionalTitleOptions.find((option) => option.id === form.title)
      ?.label ?? "Dr.";
  const professionalName = [selectedTitle, form.fullName.trim()]
    .filter(Boolean)
    .join(" ")
    .trim();
  const professionalGreeting = professionalName || "Doctor";

  const isCurrentStepValid = (() => {
    switch (currentStep) {
      case 0:
        return true;
      case 1:
        return Boolean(form.title) && form.fullName.trim().length > 0;
      case 2:
        return form.specialty.length > 0;
      case 3:
        return form.region.length > 0;
      case 4:
        return true;
      case 5:
        return (
          form.patientName.trim().length > 0 &&
          Number(form.patientAge) > 0 &&
          Boolean(form.patientSex) &&
          (!form.invitePatient ||
            /^\S+@\S+\.\S+$/.test(form.patientEmail.trim()))
        );
      case 6:
        return true;
      case 7:
        if (form.measurementSystem === "metric") {
          return Number(form.weight) > 0 && Number(form.heightCm) > 0;
        }

        return (
          Number(form.weight) > 0 &&
          Number(form.heightFeet) > 0 &&
          Number(form.heightInches) >= 0
        );
      default:
        return false;
    }
  })();

  function updateForm(next: Partial<ProfessionalFormState>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function goToStep(step: number) {
    setCurrentStep(Math.max(0, Math.min(step, 7)));
  }

  function handleBack() {
    if (currentStep === 0) {
      onBackToRoleSelection();
      return;
    }

    goToStep(currentStep - 1);
  }

  function saveProfessionalProgress(includePatientProfile: boolean) {
    const payload = includePatientProfile
      ? {
          ...defaultDashboardProfile,
          preferredName:
            form.patientName.trim() ||
            form.fullName.trim() ||
            defaultDashboardProfile.preferredName,
          age: form.patientAge || defaultDashboardProfile.age,
          region: form.region || defaultDashboardProfile.region,
          measurementSystem: form.measurementSystem,
          weight: form.weight || defaultDashboardProfile.weight,
          heightFeet:
            form.measurementSystem === "imperial"
              ? form.heightFeet || defaultDashboardProfile.heightFeet
              : "",
          heightInches:
            form.measurementSystem === "imperial"
              ? form.heightInches
              : "",
          heightCm:
            form.measurementSystem === "metric"
              ? form.heightCm
              : defaultDashboardProfile.heightCm,
          sexAtBirth:
            form.patientSex || defaultDashboardProfile.sexAtBirth,
          preferredFeature: "ai-doctor" as const,
          professionalProfile: {
            title: form.title,
            fullName: form.fullName.trim(),
            specialty: form.specialty,
            region: form.region,
            invitePatient: form.invitePatient,
            patientEmail: form.patientEmail.trim(),
            patientHistory: form.patientHistory.trim(),
            familyHistory: form.familyHistory.trim(),
            medicationsHistory: form.medicationsHistory.trim(),
            allergies: form.allergies.trim(),
            smokingIntensity: form.smokingIntensity,
            alcoholIntake: form.alcoholIntake,
            physicalActivity: form.physicalActivity,
            dietaryHabits: form.dietaryHabits,
            sleepPattern: form.sleepPattern,
            stressLevel: form.stressLevel,
            attachedHistoryFileName: form.attachedHistoryFileName,
          },
        }
      : {
          ...defaultDashboardProfile,
          preferredName:
            professionalName || defaultDashboardProfile.preferredName,
          region: form.region || defaultDashboardProfile.region,
          preferredFeature: "ai-doctor" as const,
          professionalProfile: {
            title: form.title,
            fullName: form.fullName.trim(),
            specialty: form.specialty,
            region: form.region,
          },
        };

    window.localStorage.setItem(
      dashboardProfileStorageKey,
      JSON.stringify(payload),
    );
  }

  function completeAndGoToDashboard(includePatientProfile: boolean) {
    saveProfessionalProgress(includePatientProfile);
    router.push("/dashboard");
  }

  function handleContinue() {
    if (!isCurrentStepValid) return;

    if (currentStep === 7) {
      completeAndGoToDashboard(true);
      return;
    }

    goToStep(currentStep + 1);
  }

  function handleHistoryUpload(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    updateForm({
      attachedHistoryFileName: nextFile ? nextFile.name : "",
    });
  }

  const patientStepIndex = currentStep - 5;

  return (
    <>
      {currentStep === 0 ? (
        <OnboardingCard className="max-w-4xl">
          <div className="space-y-8 text-center">
            <ProfessionalIntroIllustration />

            <div className="space-y-4">
              <StepTitle
                title="Welcome to MediAI"
                description="Your AI medical assistant for clinical efficiency"
                align="center"
              />

              <p className="mx-auto max-w-3xl text-base leading-7 text-muted-foreground">
                We&apos;re going to ask you 3 questions to personalize your AI
                medical assistant. It won&apos;t take more than a minute.
              </p>
            </div>

            <StepNotice className="mx-auto max-w-xl justify-center">
              By starting you agree to the terms of use for professionals.
            </StepNotice>

            <div className="flex items-center justify-center gap-3">
              <SecondaryButton onClick={handleBack}>Back</SecondaryButton>
              <PrimaryButton onClick={handleContinue}>Start</PrimaryButton>
            </div>
          </div>
        </OnboardingCard>
      ) : null}

      {currentStep === 1 ? (
        <OnboardingCard className="max-w-4xl">
          <div className="space-y-8">
            <div className="mx-auto max-w-2xl space-y-4">
              <StepTitle
                title="Let's get to know you!"
                description="How should we greet you?"
                align="center"
              />
              <p className="text-center text-sm leading-6 text-muted-foreground">
                Please provide your title and name.
              </p>
            </div>

            <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
              <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
                <FieldWrapper label="Title">
                  <SelectField
                    value={form.title}
                    onChange={(event) =>
                      updateForm({
                        title: event.target.value as ProfessionalTitleOption["id"],
                      })
                    }
                  >
                    {config.professionalTitleOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </SelectField>
                </FieldWrapper>

                <FieldWrapper label="Name">
                  <TextField
                    value={form.fullName}
                    onChange={(event) =>
                      updateForm({ fullName: event.target.value })
                    }
                    placeholder="Name"
                  />
                </FieldWrapper>
              </div>

              <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <Lock className="size-4 text-foreground" />
                  <span>
                    Privacy Note: Your data is confidential and secured by HIPAA
                    and GDPR standards.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <SecondaryButton onClick={handleBack}>Back</SecondaryButton>
              <PrimaryButton
                disabled={!isCurrentStepValid}
                onClick={handleContinue}
              >
                Continue
              </PrimaryButton>
            </div>
          </div>
        </OnboardingCard>
      ) : null}

      {currentStep === 2 ? (
        <OnboardingCard className="max-w-4xl">
          <div className="space-y-8 text-center">
            <SpecialtyIllustration />

            <div className="space-y-3">
              <StepTitle
                title="What's your specialty?"
                description="Select the specialty that matches your expertise. This helps us tailor our features to your practice."
                align="center"
              />
            </div>

            <div className="mx-auto w-full max-w-xl">
              <FieldWrapper label="Specialty" hideLabel>
                <SelectField
                  value={form.specialty}
                  onChange={(event) =>
                    updateForm({ specialty: event.target.value })
                  }
                >
                  <option value="">Select your specialty</option>
                  {config.professionalSpecialtyOptions.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </SelectField>
              </FieldWrapper>
            </div>

            <div className="flex items-center justify-center gap-3">
              <SecondaryButton onClick={handleBack}>Back</SecondaryButton>
              <PrimaryButton
                disabled={!isCurrentStepValid}
                onClick={handleContinue}
              >
                Continue
              </PrimaryButton>
            </div>
          </div>
        </OnboardingCard>
      ) : null}

      {currentStep === 3 ? (
        <OnboardingCard className="max-w-4xl">
          <div className="space-y-8 text-center">
            <RegionIllustration />

            <div className="space-y-3">
              <StepTitle
                title="In which part of Ethiopia do you live?"
                description="Selecting your region helps us tailor our services and ensure compliance with local regulations."
                align="center"
              />
            </div>

            <div className="mx-auto w-full max-w-xl">
              <FieldWrapper label="Region" hideLabel>
                <SelectField
                  value={form.region}
                  onChange={(event) =>
                    updateForm({ region: event.target.value })
                  }
                >
                  <option value="">Select your Region</option>
                  {config.ethiopianRegions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </SelectField>
              </FieldWrapper>
            </div>

            <div className="flex items-center justify-center gap-3">
              <SecondaryButton onClick={handleBack}>Back</SecondaryButton>
              <PrimaryButton
                disabled={!isCurrentStepValid}
                onClick={handleContinue}
              >
                Continue
              </PrimaryButton>
            </div>
          </div>
        </OnboardingCard>
      ) : null}

      {currentStep === 4 ? (
        <OnboardingCard className="max-w-3xl">
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                👌 {professionalGreeting}, your setup is complete!
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Let&apos;s get started by creating your patient profile.
              </h2>
            </div>

            <div className="space-y-4">
              {config.professionalCompletionItems.map((item) => (
                <div key={item} className="flex items-center gap-3 text-base">
                  <CheckCircle2 className="size-5 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-4">
              <PrimaryButton
                className="h-11 gap-2 px-6 text-base"
                onClick={() => goToStep(5)}
              >
                <Plus className="size-4" />
                Create First Patient
              </PrimaryButton>

              <button
                type="button"
                onClick={() => completeAndGoToDashboard(false)}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Skip to My Dashboard
              </button>
            </div>
          </div>
        </OnboardingCard>
      ) : null}

      {currentStep === 5 ? (
        <OnboardingCard className="max-w-3xl">
          <div className="space-y-8">
            <ProgressHeader
              title={patientSetupSteps[patientStepIndex]}
              currentStep={patientStepIndex}
              totalSteps={patientSetupSteps.length}
            />

            <div className="space-y-5">
              <FieldWrapper label="Name or Nickname *">
                <TextField
                  value={form.patientName}
                  onChange={(event) =>
                    updateForm({ patientName: event.target.value })
                  }
                  placeholder="Enter the patient name or nickname"
                />
              </FieldWrapper>

              <FieldWrapper label="Age *">
                <TextField
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={form.patientAge}
                  onChange={(event) =>
                    updateForm({ patientAge: event.target.value })
                  }
                  placeholder="e.g. 5"
                />
              </FieldWrapper>

              <FieldWrapper label="Biological Sex *">
                <SelectField
                  value={form.patientSex}
                  onChange={(event) =>
                    updateForm({
                      patientSex: event.target.value as SexOption["id"] | "",
                    })
                  }
                >
                  <option value="">Choose Sex</option>
                  {config.sexOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option>
                  ))}
                </SelectField>
              </FieldWrapper>

              <div className="space-y-4 rounded-2xl border border-primary/10 bg-background px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Invite Patient to Connect on Docus
                    </p>
                    <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                      Connect to receive and share real-time health updates and
                      structured reports with essential insights. Stay updated to
                      offer proactive treatment and personalized support.
                    </p>
                  </div>

                  <ToggleSwitch
                    checked={form.invitePatient}
                    onChange={(checked) =>
                      updateForm({
                        invitePatient: checked,
                        patientEmail: checked ? form.patientEmail : "",
                      })
                    }
                  />
                </div>

                {form.invitePatient ? (
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <TextField
                      className="pl-11"
                      type="email"
                      value={form.patientEmail}
                      onChange={(event) =>
                        updateForm({ patientEmail: event.target.value })
                      }
                      placeholder="Enter Patient's Email"
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <PatientActions
              onBack={handleBack}
              onNext={handleContinue}
              nextDisabled={!isCurrentStepValid}
            />
          </div>
        </OnboardingCard>
      ) : null}

      {currentStep === 6 ? (
        <OnboardingCard className="max-w-4xl">
          <div className="space-y-8">
            <ProgressHeader
              title={patientSetupSteps[patientStepIndex]}
              currentStep={patientStepIndex}
              totalSteps={patientSetupSteps.length}
            />

            <div className="space-y-6">
              <FieldWrapper label="Chronic conditions and past medical history (optional)">
                <TextAreaField
                  rows={4}
                  value={form.patientHistory}
                  onChange={(event) =>
                    updateForm({ patientHistory: event.target.value })
                  }
                  placeholder="Write patient's medical history here..."
                />
              </FieldWrapper>

              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpeg,.jpg,.jfif,.webp"
                  className="hidden"
                  onChange={handleHistoryUpload}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl border border-dashed border-primary/25 bg-primary/[0.03] px-5 text-sm font-medium text-foreground transition-colors hover:bg-primary/5"
                >
                  <Upload className="size-4 text-primary" />
                  <span>
                    {form.attachedHistoryFileName || "Attach Medical History"}
                  </span>
                </button>
                <p className="text-xs text-muted-foreground">
                  PDF, PNG, JPEG, JFIF, WEBP or JPG - max 20MB, max 15 pages
                </p>
              </div>

              <ExpandableNoteField
                label="Family Medical History"
                value={form.familyHistory}
                expanded={expandedNotes.familyHistory}
                placeholder="Add relevant family medical history..."
                onToggle={() =>
                  setExpandedNotes((current) => ({
                    ...current,
                    familyHistory: !current.familyHistory,
                  }))
                }
                onChange={(value) => updateForm({ familyHistory: value })}
              />

              <ExpandableNoteField
                label="Medications History"
                value={form.medicationsHistory}
                expanded={expandedNotes.medicationsHistory}
                placeholder="List current or recent medications..."
                onToggle={() =>
                  setExpandedNotes((current) => ({
                    ...current,
                    medicationsHistory: !current.medicationsHistory,
                  }))
                }
                onChange={(value) => updateForm({ medicationsHistory: value })}
              />

              <ExpandableNoteField
                label="Allergies"
                value={form.allergies}
                expanded={expandedNotes.allergies}
                placeholder="List any known allergies..."
                onToggle={() =>
                  setExpandedNotes((current) => ({
                    ...current,
                    allergies: !current.allergies,
                  }))
                }
                onChange={(value) => updateForm({ allergies: value })}
              />
            </div>

            <PatientActions onBack={handleBack} onNext={handleContinue} />
          </div>
        </OnboardingCard>
      ) : null}

      {currentStep === 7 ? (
        <OnboardingCard className="max-w-4xl">
          <div className="space-y-8">
            <ProgressHeader
              title={patientSetupSteps[patientStepIndex]}
              currentStep={patientStepIndex}
              totalSteps={patientSetupSteps.length}
            />

            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  BMI Information
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  {config.measurementSystemOptions.map((option) => (
                    <OptionCard
                      key={option.id}
                      title={option.title}
                      description=""
                      selected={form.measurementSystem === option.id}
                      onClick={() =>
                        updateForm({ measurementSystem: option.id })
                      }
                      className="min-h-0 py-4 text-center"
                    />
                  ))}
                </div>
              </div>

              {form.measurementSystem === "metric" ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <FieldWrapper label="Height">
                    <div className="relative">
                      <TextField
                        type="number"
                        min="0"
                        inputMode="decimal"
                        value={form.heightCm}
                        onChange={(event) =>
                          updateForm({ heightCm: event.target.value })
                        }
                        placeholder="e.g. 170"
                        className="pr-14"
                      />
                      <UnitAdornment>cm</UnitAdornment>
                    </div>
                  </FieldWrapper>

                  <FieldWrapper label="Weight">
                    <div className="relative">
                      <TextField
                        type="number"
                        min="0"
                        inputMode="decimal"
                        value={form.weight}
                        onChange={(event) =>
                          updateForm({ weight: event.target.value })
                        }
                        placeholder="e.g. 70"
                        className="pr-14"
                      />
                      <UnitAdornment>kg</UnitAdornment>
                    </div>
                  </FieldWrapper>
                </div>
              ) : (
                <div className="space-y-5">
                  <FieldWrapper label="Height">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="relative">
                        <TextField
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={form.heightFeet}
                          onChange={(event) =>
                            updateForm({ heightFeet: event.target.value })
                          }
                          placeholder="e.g. 5"
                          className="pr-12"
                        />
                        <UnitAdornment>ft</UnitAdornment>
                      </div>

                      <div className="relative">
                        <TextField
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={form.heightInches}
                          onChange={(event) =>
                            updateForm({ heightInches: event.target.value })
                          }
                          placeholder="e.g. 6"
                          className="pr-12"
                        />
                        <UnitAdornment>in</UnitAdornment>
                      </div>
                    </div>
                  </FieldWrapper>

                  <FieldWrapper label="Weight">
                    <div className="relative">
                      <TextField
                        type="number"
                        min="0"
                        inputMode="decimal"
                        value={form.weight}
                        onChange={(event) =>
                          updateForm({ weight: event.target.value })
                        }
                        placeholder="e.g. 155"
                        className="pr-12"
                      />
                      <UnitAdornment>lb</UnitAdornment>
                    </div>
                  </FieldWrapper>
                </div>
              )}

              <FieldWrapper label="Daily Smoking Intensity (optional)">
                <SelectField
                  value={form.smokingIntensity}
                  onChange={(event) =>
                    updateForm({ smokingIntensity: event.target.value })
                  }
                >
                  <option value="">Select</option>
                  {config.smokingIntensityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </SelectField>
              </FieldWrapper>

              <FieldWrapper label="Weekly alcohol intake (optional)">
                <SelectField
                  value={form.alcoholIntake}
                  onChange={(event) =>
                    updateForm({ alcoholIntake: event.target.value })
                  }
                >
                  <option value="">Select</option>
                  {config.alcoholIntakeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </SelectField>
              </FieldWrapper>

              <FieldWrapper label="Weekly physical activity level (optional)">
                <SelectField
                  value={form.physicalActivity}
                  onChange={(event) =>
                    updateForm({ physicalActivity: event.target.value })
                  }
                >
                  <option value="">Select</option>
                  {config.physicalActivityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </SelectField>
              </FieldWrapper>

              <FieldWrapper label="Dietary habits (optional)">
                <SelectField
                  value={form.dietaryHabits}
                  onChange={(event) =>
                    updateForm({ dietaryHabits: event.target.value })
                  }
                >
                  <option value="">Select</option>
                  {config.dietaryHabitOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </SelectField>
              </FieldWrapper>

              <FieldWrapper label="Daily sleep pattern (optional)">
                <SelectField
                  value={form.sleepPattern}
                  onChange={(event) =>
                    updateForm({ sleepPattern: event.target.value })
                  }
                >
                  <option value="">Select</option>
                  {config.sleepPatternOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </SelectField>
              </FieldWrapper>

              <FieldWrapper label="Stress level (optional)">
                <SelectField
                  value={form.stressLevel}
                  onChange={(event) =>
                    updateForm({ stressLevel: event.target.value })
                  }
                >
                  <option value="">Select</option>
                  {config.stressLevelOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </SelectField>
              </FieldWrapper>
            </div>

            <PatientActions
              onBack={handleBack}
              onNext={handleContinue}
              nextDisabled={!isCurrentStepValid}
            />
          </div>
        </OnboardingCard>
      ) : null}
    </>
  );
}

function PatientActions({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <SecondaryButton onClick={onBack}>Previous</SecondaryButton>
      <PrimaryButton disabled={nextDisabled} onClick={onNext}>
        Next
      </PrimaryButton>
    </div>
  );
}

function FieldWrapper({
  label,
  children,
  hideLabel,
}: {
  label: string;
  children: React.ReactNode;
  hideLabel?: boolean;
}) {
  return (
    <label className="space-y-2">
      {hideLabel ? <span className="sr-only">{label}</span> : null}
      {!hideLabel ? (
        <span className="block text-sm font-medium text-foreground">
          {label}
        </span>
      ) : null}
      {children}
    </label>
  );
}

function TextField({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-xl border border-input bg-white px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary",
        className,
      )}
      {...props}
    />
  );
}

function TextAreaField({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-input bg-white px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary",
        className,
      )}
      {...props}
    />
  );
}

function SelectField({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-12 w-full appearance-none rounded-xl border border-input bg-white px-4 pr-10 text-sm text-foreground outline-none transition-colors focus:border-primary",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function UnitAdornment({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
      {children}
    </span>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-transparent transition-colors",
        checked ? "bg-primary" : "bg-muted-foreground/25",
      )}
    >
      <span
        className={cn(
          "inline-block size-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

function ExpandableNoteField({
  label,
  value,
  expanded,
  placeholder,
  onToggle,
  onChange,
}: {
  label: string;
  value: string;
  expanded: boolean;
  placeholder: string;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-foreground">
          {label} <span className="text-muted-foreground">(optional)</span>
        </p>
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <Plus className={cn("size-4 transition-transform", expanded && "rotate-45")} />
          {expanded ? "Hide" : "Add"}
        </button>
      </div>

      {expanded || value ? (
        <TextAreaField
          rows={3}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      ) : null}
    </div>
  );
}

function ProfessionalIntroIllustration() {
  return (
    <div className="mx-auto flex flex-col items-center gap-4">
      <div className="relative flex size-28 items-center justify-center rounded-full bg-primary/8 shadow-[0_24px_70px_-45px_rgba(76,104,220,0.55)]">
        <div className="absolute inset-3 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex size-[4.5rem] items-center justify-center rounded-full bg-white shadow-[0_20px_50px_-35px_rgba(76,104,220,0.55)]">
          <HeartPulse className="size-9 text-primary" />
        </div>
      </div>
      <div className="rounded-full border border-primary/15 bg-white px-4 py-2 text-sm text-muted-foreground shadow-sm">
        Hi! I am your Doctor.
      </div>
    </div>
  );
}

function SpecialtyIllustration() {
  return (
    <div className="mx-auto flex size-28 items-center justify-center rounded-full bg-primary/6">
      <div className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-white shadow-[0_20px_50px_-35px_rgba(76,104,220,0.7)]">
          <Stethoscope className="size-7 text-primary" />
        </div>
        <div className="flex size-14 items-center justify-center rounded-full bg-white shadow-[0_20px_50px_-35px_rgba(76,104,220,0.7)]">
          <HeartPulse className="size-7 text-primary/75" />
        </div>
      </div>
    </div>
  );
}

function RegionIllustration() {
  return (
    <div className="mx-auto flex size-28 items-center justify-center rounded-full bg-primary/6">
      <div className="flex size-16 items-center justify-center rounded-full bg-white shadow-[0_20px_50px_-35px_rgba(76,104,220,0.7)]">
        <MapPinned className="size-8 text-primary" />
      </div>
    </div>
  );
}
