"use client";

import { useEffect, useState } from "react";

import { aiDoctorSetupStorageKey } from "@/lib/dashboard-content";

export function useAIDoctorSetupStatus() {
  const [hasResolved, setHasResolved] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(aiDoctorSetupStorageKey);
      setIsSetupComplete(stored === "true");
    } catch {
      setIsSetupComplete(false);
    } finally {
      setHasResolved(true);
    }
  }, []);

  return { hasResolved, isSetupComplete };
}

