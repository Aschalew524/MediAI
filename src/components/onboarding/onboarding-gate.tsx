"use client";

import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { getAccessToken } from "@/lib/auth-storage";
import { getMeProfile } from "@/lib/me-api";

export function OnboardingGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/signin?from=%2Fonboarding");
      return;
    }
    getMeProfile()
      .then((d) => {
        if (d.profile) {
          router.replace("/dashboard");
          return;
        }
        setReady(true);
      })
      .catch((e) => {
        if (isAxiosError(e) && e.response?.status === 401) {
          router.replace("/signin?from=%2Fonboarding");
          return;
        }
        setReady(true);
      });
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
