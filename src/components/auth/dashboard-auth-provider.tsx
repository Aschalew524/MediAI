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

import { isAxiosError } from "axios";

import api, { subscribeAuthCleared } from "@/lib/axios";
import { postLogout } from "@/lib/auth-api";
import {
  clearAllTokens,
  getAccessToken,
  getRefreshToken,
  syncAccessTokenToCookie,
} from "@/lib/auth-storage";
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
    syncAccessTokenToCookie();
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const { data } = await api.get<AuthUser>("/auth/me");
      setUser(data);
    } catch (err) {
      // Do not wipe tokens on network blips — the axios interceptor refreshes
      // expired access tokens and only clears on hard logout.
      if (isAxiosError(err) && err.response?.status === 401 && !getRefreshToken()) {
        clearAllTokens();
      }
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
    const refresh = getRefreshToken();
    setUser(null);
    void (async () => {
      if (refresh) {
        await postLogout(refresh);
      } else {
        clearAllTokens();
      }
      router.push("/signin");
    })();
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
