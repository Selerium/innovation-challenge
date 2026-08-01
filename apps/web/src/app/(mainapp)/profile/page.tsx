"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useProfile } from "@/lib/profile-context";
import { levelProgress } from "@repo/shared";

const reasonLabel: Record<string, string> = {
  STUDY_SESSION: "Study session",
  TOPIC_MASTERED: "Topic mastered",
  ASSIGNMENT_SUBMITTED: "Assignment submitted",
};

export default function ProfilePage() {
  const { user, profile } = useProfile();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    api("/api/gamification/transactions").then((r) => {
      if (r.success) setTransactions(r.data.data);
    });

    api("/api/study-sessions").then((r) => {
      if (r.success) setSessions(r.data.data);
    });
  }, []);

  const p = profile;

  const xp = p?.xp || 0;
  const { level, xpIntoLevel, xpForCurrentLevel, nextLevelAt, progress: levelProgressPct } = levelProgress(xp);

  const completedSessions = sessions.filter((s) => !s.active);

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profile</h1>
        <div className="rounded-xl border border-border bg-secondary p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary">
              {p?.displayName?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{p?.displayName || user?.name}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">{user?.role === "TEACHER" ? "Teacher" : "Student"}</p>
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Level {level}</span>
              <span className="font-bold text-primary">{xp} XP</span>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${levelProgressPct}%` }} />
            </div>
            <div className="text-xs text-muted-foreground mt-1.5 text-right">
              {xpIntoLevel} / {nextLevelAt - xpForCurrentLevel} XP to Level {level + 1}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-secondary">
          <div className="border-b border-border px-5 py-3">
            <h3 className="font-semibold">Recent Activity</h3>
          </div>
          {transactions.length > 0 ? (
            <ul className="divide-y divide-border">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm font-medium">{reasonLabel[t.reason] || t.reason}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                      })}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary">+{t.amount} XP</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              No activity yet — start studying to earn XP!
            </p>
          )}
        </div>

        <div className="mt-8 rounded-xl border border-border bg-secondary">
          <div className="border-b border-border px-5 py-3">
            <h3 className="font-semibold">Study Sessions</h3>
          </div>
          {completedSessions.length > 0 ? (
            <ul className="divide-y divide-border">
              {completedSessions.slice(0, 10).map((s) => (
                <li key={s.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.topicName}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.subjectName} ·{" "}
                      {new Date(s.startedAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-primary">+{s.xpEarned} XP</div>
                    <div className="text-xs text-muted-foreground">{s.durationMinutes} min</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              No study sessions yet. Chat with the AI tutor on a topic to start one.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
