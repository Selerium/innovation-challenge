"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { AddSubjectModal } from "@/components/subjects/add-subject-modal";

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const result = await api("/api/session");
      if (!result.success || !result.data) {
        router.push("/auth/sign-in");
        return;
      }

      if (result.data.profile?.onboardingDone == false) {
        router.push("/onboarding");
        return;
      }

      setProfile(result.data.data);
      setLoading(false);
    }
    load();
  }, [router]);

  useEffect(() => {
    if (!loading) {
      api<{ data: any[] }>("/api/subjects").then((r) => {
        if (r.success) setSubjects(r.data!.data);
      });
    }
  }, [loading]);

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
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome, {p?.displayName}!
            </h1>
            <p className="subheading text-muted-foreground mt-1">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-secondary p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">My Subjects</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{subjects.length} subjects</span>
                <span
                  onClick={() => setModalOpen(true)}
                  className="cursor-pointer rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  + Add
                </span>
              </div>
            </div>
            {subjects.length > 0 ? (
              <div className="space-y-2">
                {subjects.slice(0, 5).map((s) => (
                  <Link
                    key={s.id}
                    href={`/subjects/${s.id}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.grade}</div>
                    </div>
                    <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                      Go &rarr;
                    </span>
                  </Link>
                ))}
                {subjects.length > 5 && (
                  <Link href="/subjects" className="block text-center text-xs text-muted-foreground hover:text-primary pt-1 transition-colors">
                    View all {subjects.length} subjects
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">No subjects yet</p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Add Your First Subject
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-secondary p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Assignments</h3>
              <span
                onClick={() => {}}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  subjects.length === 0
                    ? "cursor-not-allowed bg-muted text-muted-foreground opacity-40"
                    : "cursor-pointer border border-border hover:bg-muted"
                }`}
                title={subjects.length === 0 ? "Add a subject first" : undefined}
              >
                + Add
              </span>
            </div>
            <p className="text-sm text-muted-foreground">No assignments yet</p>
          </div>
        </div>
      </div>

      <AddSubjectModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={() => {
        api<{ data: any[] }>("/api/subjects").then((r) => {
          if (r.success) setSubjects(r.data!.data);
        });
      }} />
    </div>
  );
}
