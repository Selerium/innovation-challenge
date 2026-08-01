"use client";

import { WebSocketProvider, usePeerNotifications } from "@/lib/use-websocket";
import { ProfileProvider } from "@/lib/profile-context";
import { Sidebar } from "@/components/layout/sidebar";

function Notifications() {
  usePeerNotifications();
  return null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <WebSocketProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="ml-64 flex-1">
            <Notifications />
            {children}
          </main>
        </div>
      </WebSocketProvider>
    </ProfileProvider>
  );
}
