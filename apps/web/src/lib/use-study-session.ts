"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useProfile } from "@/lib/profile-context";

export const SESSION_IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 60 * 1000;

type Options = {
  enabled: boolean;
  topicId: string | null;
};

// Activity-based study-session tracking: heartbeats flow while the user is
// actively engaged; after 10 minutes of silence the server closes the session.
export function useStudySession({ enabled, topicId }: Options) {
  const { refreshProfile } = useProfile();
  const lastActivityRef = useRef(Date.now());
  const startedAtRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const topicIdRef = useRef<string | null>(null);
  const [running, setRunning] = useState(false);
  const [activeMinutes, setActiveMinutes] = useState(0);

  useEffect(() => {
    topicIdRef.current = topicId;
  }, [topicId]);

  const markActive = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (!startedAtRef.current) startedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!enabled || !topicId) return;

    lastActivityRef.current = Date.now();
    startedAtRef.current = Date.now();
    sessionIdRef.current = null;
    setRunning(false);
    setActiveMinutes(0);

    let interval: ReturnType<typeof setInterval> | null = null;

    async function beat() {
      const id = topicIdRef.current;
      if (!id) return;
      try {
        const result = await api(`/api/study-sessions/heartbeat`, {
          method: "POST",
          body: { topicId: id },
        });
        if (result.success && result.data) {
          const d = result.data.data;
          sessionIdRef.current = d.id;
          if (d.previousXp && d.previousXp.xpAwarded > 0) {
            const x = d.previousXp;
            if (x.leveledUp) {
              toast.success(`Level Up! You reached Level ${x.level} · +${x.xpAwarded} XP`);
            } else {
              toast.success(`+${x.xpAwarded} XP earned from studying`);
            }
            refreshProfile();
          }
        }
      } catch {}
    }

    async function tick() {
      const idle = Date.now() - lastActivityRef.current;
      if (idle > SESSION_IDLE_TIMEOUT_MS) {
        if (interval) clearInterval(interval);
        setRunning(false);
        return;
      }
      setRunning(true);
      if (startedAtRef.current) {
        setActiveMinutes(Math.floor((Date.now() - startedAtRef.current) / 60000));
      }
      await beat();
    }

    // Kick off immediately, then every minute
    beat();
    interval = setInterval(tick, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [enabled, topicId, refreshProfile]);

  const endSession = useCallback(async () => {
    const id = sessionIdRef.current;
    if (!id) return;
    try {
      const result = await api(`/api/study-sessions/${id}/end`, { method: "POST" });
      if (result.success && result.data) {
        const d = result.data.data;
        sessionIdRef.current = null;
        setRunning(false);
        if (d.xpAwarded > 0) {
          if (d.leveledUp) {
            toast.success(`Level Up! You reached Level ${d.level} · +${d.xpAwarded} XP`);
          } else {
            toast.success(`+${d.xpAwarded} XP earned · ${d.durationMinutes} min studied`);
          }
          refreshProfile();
        }
      }
    } catch {}
  }, [refreshProfile]);

  return { markActive, running, activeMinutes, endSession };
}
