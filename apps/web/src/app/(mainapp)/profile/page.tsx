"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    api("/api/session").then((result) => {
      if (!result.success || !result.data) {
        router.push("/auth/sign-in");
        return;
      }
      setProfile(result.data);
    });
  }, [router]);

  const user = profile?.user;
  const p = profile?.profile;

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
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <div className="text-sm text-muted-foreground">Level</div>
              <div className="text-lg font-bold">{p?.level || 1}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">XP</div>
              <div className="text-lg font-bold text-primary">{p?.xp || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
