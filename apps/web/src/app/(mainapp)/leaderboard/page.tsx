"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Entry = {
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  xp: number;
  topicsMastered: number;
  rank: number;
  isYou: boolean;
};

const rankBadge = (rank: number) =>
  rank === 1
    ? "bg-amber-400/20 text-amber-600 dark:text-amber-400"
    : rank === 2
      ? "bg-slate-400/20 text-slate-500 dark:text-slate-300"
      : rank === 3
        ? "bg-orange-400/20 text-orange-500 dark:text-orange-400"
        : "bg-muted text-muted-foreground";

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [yourRank, setYourRank] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const result = await api(`/api/gamification/leaderboard`);
      if (result.success && result.data) {
        setEntries(result.data.data.entries);
        setYourRank(result.data.data.yourRank);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-1">Leaderboard</h1>
        <p className="subheading text-muted-foreground mb-8">
          Top students by XP — keep studying to climb the ranks
        </p>

        {yourRank && (
          <div className="mb-6 rounded-xl border border-primary/40 bg-primary/10 p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Your rank</div>
              <div className="text-2xl font-bold text-primary">
                #{yourRank}
              </div>
            </div>
            {yourRank > 10 && (
              <div className="text-xs text-muted-foreground max-w-[180px] text-right">
                You&apos;re {yourRank - 10} spots away from the top 10. Keep going!
              </div>
            )}
          </div>
        )}

        {entries.length === 0 ? (
          <div className="rounded-xl border border-border bg-secondary p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No students on the leaderboard yet. Start studying to be the first!
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-secondary overflow-hidden">
            <ul className="divide-y divide-border">
              {entries.map((e) => (
                <li
                  key={e.profileId}
                  className={`flex items-center gap-4 px-5 py-4 ${
                    e.isYou ? "bg-primary/5" : ""
                  }`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${rankBadge(e.rank)}`}
                  >
                    {e.rank}
                  </span>
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                    {e.displayName?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{e.displayName}</span>
                      {e.isYou && (
                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Level {e.level} · {e.topicsMastered} topics mastered
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{e.xp}</div>
                    <div className="text-xs text-muted-foreground">XP</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
