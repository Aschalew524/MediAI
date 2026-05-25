"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isAxiosError } from "axios";

import { getMeProfile } from "@/lib/me-api";
import type { AuthUser } from "@/lib/auth.types";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  getAccessToken,
  getRefreshToken,
  syncAccessTokenToCookie,
} from "@/lib/auth-storage";
import { getProfileName, getProfessionalName } from "@/lib/dashboard-content";
import api, { subscribeAuthCleared } from "@/lib/axios";

export type PublicSession = {
  user: AuthUser;
  /** Preferred name from profile when available; otherwise email local-part. */
  displayName: string;
  homeHref: "/dashboard" | "/admin";
};

type PublicSessionContextValue = {
  session: PublicSession | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
};

const PublicSessionContext = createContext<PublicSessionContextValue | null>(
  null,
);

function resolveHomeHref(appRole?: AuthUser["appRole"]): "/dashboard" | "/admin" {
  return appRole === "admin" ? "/admin" : "/dashboard";
}

function fallbackDisplayName(user: AuthUser): string {
  const local = user.email.split("@")[0]?.trim();
  return local || user.email;
}

export function PublicSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PublicSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    syncAccessTokenToCookie();
    const token = getAccessToken();
    if (!token) {
      setSession(null);
      return;
    }
    try {
      const { data: user } = await api.get<AuthUser>("/auth/me");
      let displayName = fallbackDisplayName(user);
      if (user.appRole !== "admin") {
        try {
          const me = await getMeProfile();
          if (me.profile) {
            displayName = me.profile.professionalProfile
              ? getProfessionalName(me.profile)
              : getProfileName(me.profile);
          }
        } catch {
          /* profile optional for header label */
        }
      }
      setSession({
        user,
        displayName,
        homeHref: resolveHomeHref(user.appRole),
      });
    } catch (err) {
      // Keep tokens on transient errors — axios refresh handles expired access.
      if (isAxiosError(err) && err.response?.status === 401) {
        if (!getRefreshToken()) {
          setSession(null);
        }
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      await loadSession();
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSession]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onFocus = () => {
      void loadSession();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        syncAccessTokenToCookie();
        void loadSession();
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACCESS_TOKEN_KEY || e.key === REFRESH_TOKEN_KEY) {
        void loadSession();
      }
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    const unsubAuthCleared = subscribeAuthCleared(() => {
      setSession(null);
    });

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      unsubAuthCleared();
    };
  }, [loadSession]);

  const value = useMemo(
    () => ({
      session,
      isLoading,
      refreshSession: async () => {
        setIsLoading(true);
        await loadSession();
        setIsLoading(false);
      },
    }),
    [session, isLoading, loadSession],
  );

  return (
    <PublicSessionContext.Provider value={value}>
      {children}
    </PublicSessionContext.Provider>
  );
}

export function usePublicSession(): PublicSessionContextValue {
  const ctx = useContext(PublicSessionContext);
  if (!ctx) {
    throw new Error(
      "usePublicSession must be used within PublicSessionProvider",
    );
  }
  return ctx;
}

/** Sync cookie before navigating to a protected route from the marketing site. */
export function syncSessionBeforeProtectedNav(): void {
  syncAccessTokenToCookie();
}
