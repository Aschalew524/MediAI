"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useDashboardAuth } from "@/components/auth/dashboard-auth-provider";
import {
  DASHBOARD_ME_EVENT,
  getMeProfile,
  type GetMeProfileResponse,
} from "@/lib/me-api";
import {
  dashboardProfileStorageKey,
  defaultMedicalHistory,
} from "@/lib/dashboard-content";
import type { DashboardProfile, MedicalHistoryData } from "@/lib/dashboard-content";
import { useDashboardConfig } from "@/lib/hooks/use-app-config";

const VERIFY_DOCTOR_PATH = "/dashboard/verify-doctor";

type DashboardMeContextValue = {
  /** Server-backed profile, or config default while not loaded */
  profile: DashboardProfile;
  medicalHistory: MedicalHistoryData;
  aiDoctorSetupCompleted: boolean;
  isMeLoading: boolean;
  meError: string | null;
  /** Full server snapshot when available (profile null until onboarding) */
  raw: GetMeProfileResponse | null;
  refreshMe: () => Promise<void>;
};

const DashboardMeContext = createContext<DashboardMeContextValue | null>(null);


export function DashboardMeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading: authLoading, isAuthenticated } = useDashboardAuth();
  const { data: config } = useDashboardConfig();
  const fallback = config.defaultDashboardProfile;

  const [raw, setRaw] = useState<GetMeProfileResponse | null>(null);
  const [isMeLoading, setIsMeLoading] = useState(true);
  const [meError, setMeError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setIsMeLoading(false);
      return;
    }
    setMeError(null);
    try {
      const next = await getMeProfile();
      setRaw(next);
      if (!next.profile) {
        router.replace("/onboarding");
        return;
      }
      try {
        window.localStorage.setItem(
          dashboardProfileStorageKey,
          JSON.stringify({
            ...next.profile,
          }),
        );
      } catch {
        /* optional cache */
      }
    } catch {
      setMeError("We could not load your profile. Please try again.");
      setRaw({
        profile: null,
        medicalHistory: null,
        aiDoctorSetupCompleted: false,
      });
    } finally {
      setIsMeLoading(false);
    }
  }, [isAuthenticated, router]);

  /**
   * Doctor-verification gate. Unverified professionals anywhere outside
   * /dashboard/verify-doctor are redirected TO /dashboard/verify-doctor.
   *
   * We deliberately do NOT bounce verified doctors out of the verify-doctor
   * route — the page doubles as the "edit my public profile" surface, and
   * the verify-doctor page itself handles the "just-got-approved" transition
   * by routing the user to /dashboard.
   *
   * Personal users are never affected (they have no `verification` block).
   */
  useEffect(() => {
    const profile = raw?.profile;
    if (!profile) return;
    if (!profile.professionalProfile && !profile.verification) return;
    if (pathname === null) return;

    const isOnVerifyPage =
      pathname === VERIFY_DOCTOR_PATH ||
      pathname.startsWith(`${VERIFY_DOCTOR_PATH}/`);
    const isVerified = profile.verification?.status === "verified";

    if (!isVerified && !isOnVerifyPage) {
      router.replace(VERIFY_DOCTOR_PATH);
    }
  }, [raw, pathname, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setIsMeLoading(false);
      return;
    }
    setIsMeLoading(true);
    void load();
  }, [authLoading, isAuthenticated, load]);

  useEffect(() => {
    const onRefresh = () => {
      if (!isAuthenticated) return;
      void (async () => {
        setIsMeLoading(true);
        await load();
      })();
    };
    if (typeof window === "undefined") return;
    window.addEventListener(DASHBOARD_ME_EVENT, onRefresh);
    return () => window.removeEventListener(DASHBOARD_ME_EVENT, onRefresh);
  }, [isAuthenticated, load]);

  const profile: DashboardProfile =
    raw?.profile ? { ...fallback, ...raw.profile } : fallback;
  const medicalHistory: MedicalHistoryData =
    raw?.medicalHistory
      ? { ...defaultMedicalHistory, ...raw.medicalHistory }
      : defaultMedicalHistory;
  const aiDoctorSetupCompleted = raw?.aiDoctorSetupCompleted ?? false;

  const refreshMe = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsMeLoading(true);
    await load();
  }, [isAuthenticated, load]);

  const value: DashboardMeContextValue = {
    profile,
    medicalHistory,
    aiDoctorSetupCompleted,
    isMeLoading: authLoading || (isMeLoading && isAuthenticated),
    meError,
    raw,
    refreshMe,
  };

  return (
    <DashboardMeContext.Provider value={value}>
      {children}
    </DashboardMeContext.Provider>
  );
}

export function useDashboardMe() {
  const v = useContext(DashboardMeContext);
  if (!v) {
    throw new Error("useDashboardMe must be used within DashboardMeProvider");
  }
  return v;
}

/**
 * Use inside `DashboardMeProvider` to block the dashboard until `/me/profile` is loaded.
 */
export function DashboardWithMeEntrance({ children }: { children: ReactNode }) {
  const { isMeLoading, meError } = useDashboardMe();
  if (isMeLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <>
      {meError ? (
        <div
          className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive"
          role="alert"
        >
          {meError}
        </div>
      ) : null}
      {children}
    </>
  );
}
