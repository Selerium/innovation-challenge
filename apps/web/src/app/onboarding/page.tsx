"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PageLoading } from "@/components/ui/loading";

export default function Onboarding() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkSession() {
      if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
        router.replace("/dashboard");
        return;
      }
      const sessionResult = await api("/api/session");
      if (!sessionResult.success || !sessionResult.data?.data?.profile) {
        router.replace("/auth/sign-in");
        return;
      }
      if (sessionResult.data.data.profile.onboardingDone) {
        router.replace("/dashboard");
        return;
      }
      setChecking(false);
    }
    checkSession();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await api("/api/profile", {
      method: "PUT",
      body: { displayName, bio: bio || undefined, role },
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error || "Failed to save profile");
      toast.error(result.error || "Failed to save profile");
      return;
    }

    router.push("/dashboard");
  }

  if (checking) {
    return <PageLoading />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-xl border border-border bg-secondary p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Welcome!</h1>
        <p className="text-center text-sm text-muted-foreground mb-6">
          Set up your profile to get started.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("STUDENT")}
                className={`rounded-lg border p-4 text-center font-medium transition-colors ${
                  role === "STUDENT"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole("TEACHER")}
                className={`rounded-lg border p-4 text-center font-medium transition-colors ${
                  role === "TEACHER"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                Teacher
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="What should we call you?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Bio <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={200}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Tell us a bit about yourself..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving..." : "Get Started"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          disabled={loading}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
