"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { api } from "@/lib/api";
import { WebSocketProvider, usePeerNotifications } from "@/lib/use-websocket";
import { Sidebar } from "@/components/layout/sidebar";

function Notifications() {
  usePeerNotifications();
  return null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await api("/api/session");
      if (!result.success || !result.data) {
        router.push("/auth/sign-in");
        return;
      }

      if (result.data.profile?.onboardingDone == false) {
        router.push("/onboarding");
        return;
      }

      setProfile(result.data.data);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <WebSocketProvider>
      <div className="flex min-h-screen">
        <Sidebar profile={profile} />
        <main className="ml-64 flex-1">
          <Notifications />
          {children}
        </main>
        <Toaster richColors position="top-right" />
      </div>
    </WebSocketProvider>
  );
}
