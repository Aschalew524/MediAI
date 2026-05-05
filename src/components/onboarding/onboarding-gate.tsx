"use client";

import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { getAccessToken } from "@/lib/auth-storage";
import { getMeProfile } from "@/lib/me-api";
import { BrandMark, OnboardingCard, OnboardingShell, PrimaryButton, SecondaryButton, StepTitle } from "@/components/onboarding/primitives";

export function OnboardingGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!getAccessToken()) {
        router.replace("/signin?from=%2Fonboarding");
        return;
      }
      setLoading(true);
      setFatalError(null);
      try {
        const d = await getMeProfile();
        if (cancelled) return;
        if (d.profile) {
          router.replace("/dashboard");
          return;
        }
        setReady(true);
      } catch (e: unknown) {
        if (cancelled) return;
        if (isAxiosError(e) && e.response?.status === 401) {
          router.replace("/signin?from=%2Fonboarding");
          return;
        }
        setFatalError("We couldn’t load your profile. Check your connection and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready && loading && !fatalError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ready && fatalError) {
    return (
      <OnboardingShell>
        <BrandMark />
        <OnboardingCard>
          <div className="space-y-8">
            <StepTitle title="Something went wrong" description={fatalError} align="center" />
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PrimaryButton
                onClick={() => {
                  // Re-run effect by forcing a navigation to the same route.
                  router.refresh();
                }}
              >
                Retry
              </PrimaryButton>
              <SecondaryButton
                onClick={() => {
                  router.replace("/signin?from=%2Fonboarding");
                }}
              >
                Back to sign in
              </SecondaryButton>
            </div>
          </div>
        </OnboardingCard>
      </OnboardingShell>
    );
  }

  return <>{children}</>;
}
