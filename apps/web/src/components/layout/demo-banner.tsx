"use client";

import { useEffect, useState } from "react";
import { getDemoRole, setDemoRole, type DemoRole } from "@/lib/demo/role";

const DEMO_TEXT =
  "This is a demo site with dummy data for demo purposes. As such, dynamic features are currently disabled.";

export function DemoBanner() {
  const [role, setRole] = useState<DemoRole>("STUDENT");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRole(getDemoRole());
  }, []);

  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return null;

  function switchRole(next: DemoRole) {
    if (next === role) return;
    setDemoRole(next);
    window.location.reload();
  }

  const pill = (value: DemoRole, label: string) => (
    <button
      type="button"
      onClick={() => switchRole(value)}
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
        mounted && role === value
          ? "bg-amber-600 text-white"
          : "text-amber-800 hover:bg-amber-200/70 dark:text-amber-200 dark:hover:bg-amber-900"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="sticky top-0 z-50 w-full border-b border-amber-500/40 bg-amber-50 px-4 py-2 dark:bg-amber-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center">
        <p className="text-xs text-amber-800 dark:text-amber-200">{DEMO_TEXT}</p>
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-medium text-amber-800 dark:text-amber-200">View as:</span>
          {pill("STUDENT", "Student")}
          {pill("TEACHER", "Teacher")}
        </div>
      </div>
    </div>
  );
}
