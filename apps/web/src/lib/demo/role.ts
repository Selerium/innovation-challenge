export type DemoRole = "STUDENT" | "TEACHER";

export const DEMO_ROLE_KEY = "eduai-demo-role";

export const DEMO_DISABLED_MESSAGE = "This feature is disabled in the demo.";

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export function getDemoRole(): DemoRole {
  if (typeof window === "undefined") return "STUDENT";
  try {
    const value = window.localStorage.getItem(DEMO_ROLE_KEY);
    return value === "TEACHER" ? "TEACHER" : "STUDENT";
  } catch {
    return "STUDENT";
  }
}

export function setDemoRole(role: DemoRole): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_ROLE_KEY, role);
}
