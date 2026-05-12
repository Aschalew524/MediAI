"use client";

import { useCallback, useEffect, useReducer } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { ArrowLeft, Loader2 } from "lucide-react";

import {
  getProfessionalPatient,
  type ApiPatientDetail,
} from "@/lib/services/professional-api";

import { ProfessionalPatientProfilePage } from "./professional-patient-profile";
import { ProfessionalDashboardShell } from "./professional-shell";
import { useDashboardProfile } from "./use-dashboard-profile";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string; code?: number }
  | { status: "ready"; data: ApiPatientDetail };

type FetchAction =
  | { type: "request" }
  | { type: "success"; data: ApiPatientDetail }
  | { type: "failure"; message: string; code?: number };

function reducer(_state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case "request":
      return { status: "loading" };
    case "success":
      return { status: "ready", data: action.data };
    case "failure":
      return { status: "error", message: action.message, code: action.code };
    default:
      return _state;
  }
}

export function PatientDetailPage({ patientId }: { patientId: string }) {
  const viewerProfile = useDashboardProfile();
  const [state, dispatch] = useReducer(reducer, { status: "loading" });

  const fetchPatient = useCallback(
    async (signal?: { cancelled: boolean }) => {
      try {
        const data = await getProfessionalPatient(patientId);
        if (signal?.cancelled) return;
        dispatch({ type: "success", data });
      } catch (err: unknown) {
        if (signal?.cancelled) return;
        const code = isAxiosError(err) ? err.response?.status : undefined;
        const message =
          code === 404
            ? "This patient could not be found."
            : code === 403
              ? "Only professional accounts can view patient profiles."
              : "Could not load this patient. Try again in a moment.";
        dispatch({ type: "failure", message, code });
      }
    },
    [patientId],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    dispatch({ type: "request" });
    void fetchPatient(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [fetchPatient]);

  // Lets child modals notify us with the fresh `ApiPatientDetail` that the
  // PATCH/PUT endpoints return — saves an extra GET when the doctor edits
  // through one of the dialogs.
  const applyServerSnapshot = useCallback((data: ApiPatientDetail) => {
    dispatch({ type: "success", data });
  }, []);

  if (state.status === "loading") {
    return (
      <ProfessionalDashboardShell profile={viewerProfile}>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </ProfessionalDashboardShell>
    );
  }

  if (state.status === "error") {
    return (
      <ProfessionalDashboardShell profile={viewerProfile}>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-10 text-center">
          <p className="text-base font-semibold text-destructive">
            {state.message}
          </p>
          <Link
            href="/dashboard/patients"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to all patients
          </Link>
        </div>
      </ProfessionalDashboardShell>
    );
  }

  return (
    <ProfessionalPatientProfilePage
      viewerProfile={viewerProfile}
      patient={state.data.profile}
      patientId={state.data.id}
      patientEmail={state.data.email}
      medicalHistory={state.data.medicalHistory}
      lastUpdatedAt={state.data.lastUpdatedAt}
      onPatientUpdated={applyServerSnapshot}
    />
  );
}
