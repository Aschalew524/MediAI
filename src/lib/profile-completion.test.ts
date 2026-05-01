import { describe, expect, it } from "vitest";

import {
  defaultDashboardProfile,
  defaultMedicalHistory,
  type DashboardProfile,
  type MedicalHistoryData,
} from "@/lib/dashboard-content";

import { computeProfileCompletion } from "@/lib/profile-completion";

describe("computeProfileCompletion", () => {
  it("returns zeros for empty personal profile and empty medical history", () => {
    const profile: DashboardProfile = {
      preferredName: "",
      age: "",
      region: "",
      measurementSystem: "imperial",
      weight: "",
      heightFeet: "",
      heightInches: "",
      heightCm: "",
      sexAtBirth: null,
      preferredFeature: null,
    };
    const emptyMedical: MedicalHistoryData = { ...defaultMedicalHistory };
    const r = computeProfileCompletion(profile, emptyMedical);
    expect(r.segments.general).toBe(0);
    expect(r.segments.medical).toBe(0);
    expect(r.overall).toBe(0);
    expect(r.segments.mainHealthHub).toBe(0);
  });

  it("scores full general for complete personal demographics", () => {
    const profile: DashboardProfile = {
      ...defaultDashboardProfile,
      preferredName: "Alex",
      age: "30",
      region: "NYC",
      measurementSystem: "imperial",
      weight: "70",
      heightFeet: "5",
      heightInches: "10",
      sexAtBirth: "female",
    };
    const r = computeProfileCompletion(profile, defaultMedicalHistory);
    expect(r.segments.general).toBe(100);
    expect(r.segments.medical).toBe(0);
    expect(r.overall).toBe(50);
  });

  it("counts metric height from heightCm only", () => {
    const profile: DashboardProfile = {
      ...defaultDashboardProfile,
      measurementSystem: "metric",
      heightFeet: "",
      heightInches: "",
      heightCm: "175",
      weight: "70",
      sexAtBirth: "male",
    };
    const r = computeProfileCompletion(profile, defaultMedicalHistory);
    expect(r.segments.general).toBe(100);
  });

  it("scores medical from filled blocks and lifestyle fields", () => {
    const profile: DashboardProfile = {
      ...defaultDashboardProfile,
      preferredName: "A",
      age: "40",
      region: "X",
      weight: "1",
      heightFeet: "6",
      sexAtBirth: "other",
    };
    const medical: MedicalHistoryData = {
      ...defaultMedicalHistory,
      chronicDiseases: ["Diabetes"],
      allergies: ["Peanuts"],
      currentMedications: "Aspirin",
      smokingIntensity: "Non-smoker",
      alcoholIntake: "Non-drinker",
      dietaryHabits: "Balanced Meals",
      activityLevel: "Lightly Active",
      sleepPattern: "7-9 hours",
      stressLevel: "Rarely Stressed",
    };
    const r = computeProfileCompletion(profile, medical);
    expect(r.segments.medical).toBe(100);
    expect(r.segments.general).toBe(100);
    expect(r.overall).toBe(100);
  });

  it("uses professionalProfile for general when present", () => {
    const profile: DashboardProfile = {
      ...defaultDashboardProfile,
      preferredName: "",
      age: "",
      region: "",
      weight: "",
      heightFeet: "",
      professionalProfile: {
        title: "dr",
        fullName: "Pat Lee",
        specialty: "Cardiology",
        region: "Boston",
      },
    };
    const r = computeProfileCompletion(profile, defaultMedicalHistory);
    expect(r.segments.general).toBe(100);
    expect(r.segments.medical).toBe(0);
  });

  it("clamps partial medical to mid-range", () => {
    const profile: DashboardProfile = {
      ...defaultDashboardProfile,
      preferredName: "B",
      age: "25",
      region: "Y",
      weight: "60",
      heightFeet: "5",
      sexAtBirth: "male",
    };
    const medical: MedicalHistoryData = {
      ...defaultMedicalHistory,
      chronicDiseases: ["Diabetes"],
      allergies: [],
      allergyDetails: "",
      currentMedications: "",
      pastMedications: "",
    };
    const r = computeProfileCompletion(profile, medical);
    expect(r.segments.general).toBe(100);
    expect(r.segments.medical).toBeGreaterThan(0);
    expect(r.segments.medical).toBeLessThan(100);
  });
});
