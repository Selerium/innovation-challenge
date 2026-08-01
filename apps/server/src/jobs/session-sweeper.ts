import { closeStaleSessions } from "../lib/study-sessions.ts";

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

let timer: ReturnType<typeof setInterval> | null = null;

export function startSessionSweeper() {
  if (timer) return;

  timer = setInterval(async () => {
    try {
      const closed = await closeStaleSessions();
      if (closed.length > 0) {
        console.log(`[session-sweeper] closed ${closed.length} idle study session(s)`);
      }
    } catch (err: any) {
      console.error("[session-sweeper] failed:", err.message);
    }
  }, SWEEP_INTERVAL_MS);

  console.log("[session-sweeper] running every 5m");
}
