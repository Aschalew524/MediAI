"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import api, { subscribeAuthCleared } from "@/lib/axios";
import { clearAccessToken, getAccessToken } from "@/lib/auth-storage";
import type { AuthUser } from "@/lib/auth.types";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function DashboardAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadSession = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const { data } = await api.get<AuthUser>("/auth/me");
      setUser(data);
    } catch {
      clearAccessToken();
      setUser(null);
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
    return subscribeAuthCleared(() => {
      setUser(null);
    });
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadSession();
    setIsLoading(false);
  }, [loadSession]);

  const logout = useCallback(() => {
    clearAccessToken();
    setUser(null);
    router.push("/signin");
  }, [router]);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useDashboardAuth() {
  const v = useContext(AuthContext);
  if (!v) {
    throw new Error("useDashboardAuth must be used within DashboardAuthProvider");
  }
  return v;
}
