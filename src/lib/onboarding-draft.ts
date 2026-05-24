export type OnboardingDraftV1 = {
  v: 1;
  savedAt: string;
  currentStep: number;
  form: {
    role: "personal" | "professional" | null;
    preferredName: string;
    isConfirmedAdult: boolean;
    region: string;
    age: string;
    measurementSystem: "imperial" | "metric" | null;
    weight: string;
    heightFeet: string;
    heightInches: string;
    heightCm: string;
    sexAtBirth: "male" | "female" | "other" | null;
    preferredFeature: "ai-doctor" | "top-doctors" | null;
  };
};

const KEY = "mediai:onboardingDraft:v1";
const TTL_MS = 24 * 60 * 60 * 1000;

function safeGet(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function safeSet(value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, value);
  } catch {
    // ignore (quota, privacy mode, etc.)
  }
}

export function clearOnboardingDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function isDraftExpired(savedAtIso: string): boolean {
  const t = Date.parse(savedAtIso);
  if (!Number.isFinite(t)) return true;
  return Date.now() - t > TTL_MS;
}

function isString(x: unknown): x is string {
  return typeof x === "string";
}

function isBool(x: unknown): x is boolean {
  return typeof x === "boolean";
}

function isStep(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

function normalizeDraft(raw: unknown): OnboardingDraftV1 | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (r.v !== 1) return null;
  if (!isString(r.savedAt) || isDraftExpired(r.savedAt)) return null;
  if (!isStep(r.currentStep)) return null;
  if (!r.form || typeof r.form !== "object" || Array.isArray(r.form)) return null;

  const f = r.form as Record<string, unknown>;
  const role =
    f.role === "personal" || f.role === "professional" || f.role === null
      ? f.role
      : null;
  const ms =
    f.measurementSystem === "imperial" ||
    f.measurementSystem === "metric" ||
    f.measurementSystem === null
      ? f.measurementSystem
      : null;
  const sex =
    f.sexAtBirth === "male" ||
    f.sexAtBirth === "female" ||
    f.sexAtBirth === "other" ||
    f.sexAtBirth === null
      ? f.sexAtBirth
      : null;
  const rawPf = f.preferredFeature;
  const pf =
    rawPf === "ai-doctor" || rawPf === "top-doctors"
      ? rawPf
      : rawPf === "lab-test-interpretation" || rawPf === "lab-interpretation"
        ? "ai-doctor"
        : rawPf === null
          ? null
          : null;

  if (role === null) return null;

  return {
    v: 1,
    savedAt: r.savedAt,
    currentStep: r.currentStep,
    form: {
      role,
      preferredName: isString(f.preferredName) ? f.preferredName : "",
      isConfirmedAdult: isBool(f.isConfirmedAdult) ? f.isConfirmedAdult : false,
      region: isString(f.region) ? f.region : "",
      age: isString(f.age) ? f.age : "",
      measurementSystem: ms,
      weight: isString(f.weight) ? f.weight : "",
      heightFeet: isString(f.heightFeet) ? f.heightFeet : "",
      heightInches: isString(f.heightInches) ? f.heightInches : "",
      heightCm: isString(f.heightCm) ? f.heightCm : "",
      sexAtBirth: sex,
      preferredFeature: pf,
    },
  };
}

export function loadOnboardingDraft(): OnboardingDraftV1 | null {
  const raw = safeGet();
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    const norm = normalizeDraft(parsed);
    if (!norm) {
      clearOnboardingDraft();
      return null;
    }
    return norm;
  } catch {
    clearOnboardingDraft();
    return null;
  }
}

export function saveOnboardingDraft(draft: OnboardingDraftV1): void {
  if (typeof window === "undefined") return;
  safeSet(JSON.stringify(draft));
}

