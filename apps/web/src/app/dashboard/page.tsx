"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await api("/api/session");
      if (!result.success || !result.data) {
        router.push("/auth/sign-in");
        return;
      }

      console.log(result.data);

      if (result.data.profile?.onboardingDone == false) {
        router.push("/onboarding");
        return;
      }

      setProfile(result.data.data);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const user = profile?.user;
  const p = profile?.profile;

  async function handleSignOut() {
    await api("/api/auth/sign-out", { method: "POST" });
    router.push("/auth/sign-in");
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome, {p?.displayName}!
            </h1>
            <p className="text-muted-foreground mt-1">
              {user?.role === "TEACHER" ? "Teacher" : "Student"} Dashboard
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Level {p?.level}</div>
              <div className="text-lg font-bold text-primary">{p?.xp} XP</div>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-border bg-secondary p-6">
            <h3 className="font-semibold mb-2">My Subjects</h3>
            <p className="text-sm text-muted-foreground">No subjects yet</p>
          </div>
          <div className="rounded-xl border border-border bg-secondary p-6">
            <h3 className="font-semibold mb-2">Assignments</h3>
            <p className="text-sm text-muted-foreground">No assignments yet</p>
          </div>
          <div className="rounded-xl border border-border bg-secondary p-6">
            <h3 className="font-semibold mb-2">Leaderboard</h3>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
