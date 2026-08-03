"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { api } from "@/lib/api";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type SessionProfile = {
  id: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  xp: number;
  level: number;
  onboardingDone: boolean;
  createdAt: string;
};

type SessionData = {
  user: SessionUser;
  profile: SessionProfile;
};

type ProfileContextValue = {
  user: SessionUser;
  profile: SessionProfile;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await api("/api/session");
        if (cancelled) return;
        const sessionData = (result.data as { data?: SessionData } | undefined)?.data;
        if (!result.success || !sessionData) {
          setLoading(false);
          router.push("/auth/sign-in");
          return;
        }
        if (sessionData.profile?.onboardingDone == false) {
          setLoading(false);
          router.push("/onboarding");
          return;
        }
        setSession(sessionData);
      } catch {
        // never leave the app stuck on the loading screen
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const refreshProfile = useCallback(async () => {
    const result = await api("/api/session");
    if (result.success && result.data?.data) {
      setSession((result.data as { data: SessionData }).data);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <ProfileContext.Provider
      value={{ user: session.user, profile: session.profile, loading, refreshProfile }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return ctx;
}
