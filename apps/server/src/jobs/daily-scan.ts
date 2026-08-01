import { scanAllBurnout } from "../lib/burnout.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

let timer: ReturnType<typeof setInterval> | null = null;

export function startDailyScan() {
  if (timer) return;

  timer = setInterval(async () => {
    try {
      const result = await scanAllBurnout();
      console.log(
        `[burnout-scan] scanned ${result.scanned} profiles, flagged ${result.alertsCreated}`
      );
    } catch (err: any) {
      console.error("[burnout-scan] failed:", err.message);
    }
  }, DAY_MS);

  console.log("[burnout-scan] daily scan scheduled (every 24h)");
}
