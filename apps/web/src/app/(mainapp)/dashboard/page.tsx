"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useProfile } from "@/lib/profile-context";
import { levelProgress } from "@repo/shared";
import { AddSubjectModal } from "@/components/subjects/add-subject-modal";
import { JoinClassModal } from "@/components/classes/class-modals";

export default function Dashboard() {
  const router = useRouter();
  const { user, profile } = useProfile();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [classModalOpen, setClassModalOpen] = useState(false);

  useEffect(() => {
    api<{ data: any[] }>("/api/subjects").then((r) => {
      if (r.success) setSubjects(r.data!.data);
    });
    api<{ data: any[] }>("/api/classes").then((r) => {
      if (r.success) setClasses(r.data!.data);
    });
    api<{ data: any[] }>("/api/burnout/alerts").then((r) => {
      if (r.success) setAlerts(r.data!.data.filter((a) => !a.resolved));
    });
  }, []);

  const p = profile;

  const xp = p?.xp || 0;
  const { level, xpIntoLevel, xpForCurrentLevel, nextLevelAt, progress: levelProgressPct } = levelProgress(xp);

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
            <div className="w-44">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Level {level}</span>
                <span className="font-bold text-primary">{xp} XP</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${levelProgressPct}%` }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground mt-1 text-right">
                {xpIntoLevel} / {nextLevelAt - xpForCurrentLevel} XP to Level {level + 1}
              </div>
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

        <div className="mt-6 rounded-xl border border-border bg-secondary p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">My Classes</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{classes.length} classes</span>
              <span
                onClick={() => setClassModalOpen(true)}
                className="cursor-pointer rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                + Add Class
              </span>
            </div>
          </div>
          {classes.length > 0 ? (
            <div className="space-y-2">
              {classes.map((c) => (
                <Link
                  key={c.id}
                  href={`/classes/${c.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.teacherName} · {c.memberCount} member{c.memberCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    View &rarr;
                  </span>
                </Link>
              ))}
              <Link href="/classes" className="block text-center text-xs text-muted-foreground hover:text-primary pt-1 transition-colors">
                View all classes
              </Link>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">
                No classes yet — join one with an invite code
              </p>
              <button
                onClick={() => setClassModalOpen(true)}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Add Class
              </button>
            </div>
          )}
        </div>

        {alerts.length > 0 && (
          <div className="mt-6 space-y-3">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      Burnout risk: {a.score}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{a.message}</p>
                </div>
                <button
                  onClick={async () => {
                    await api(`/api/burnout/alerts/${a.id}`, { method: "PATCH", body: { resolved: true } });
                    setAlerts(alerts.filter((x) => x.id !== a.id));
                  }}
                  className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddSubjectModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={() => {
        api<{ data: any[] }>("/api/subjects").then((r) => {
          if (r.success) setSubjects(r.data!.data);
        });
      }} />

      <JoinClassModal
        open={classModalOpen}
        onClose={() => setClassModalOpen(false)}
        onDone={() => {
          setClassModalOpen(false);
          api<{ data: any[] }>("/api/classes").then((r) => {
            if (r.success) setClasses(r.data!.data);
          });
        }}
      />
    </div>
  );
}
