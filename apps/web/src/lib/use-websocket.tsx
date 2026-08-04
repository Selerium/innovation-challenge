"use client";

import { createContext, useContext, useEffect, useRef, useCallback, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

type WsEvent = {
  type: string;
  payload: Record<string, unknown>;
};

type Handler = (payload: Record<string, unknown>) => void;

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000";

type WsContextValue = {
  on: (eventType: string, handler: Handler) => () => void;
  ready: boolean;
};

const WsContext = createContext<WsContextValue | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<Handler>>>(new Map());
  const [ready, setReady] = useState(false);

  const on = useCallback((eventType: string, handler: Handler) => {
    if (!handlersRef.current.has(eventType)) {
      handlersRef.current.set(eventType, new Set());
    }
    handlersRef.current.get(eventType)!.add(handler);
    return () => {
      handlersRef.current.get(eventType)?.delete(handler);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRetry = (delay = 5000) => {
      if (!mounted) return;
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(connect, delay);
    };

    const connect = () => {
      if (!mounted) return;

      const current = wsRef.current;
      if (current && (current.readyState === WebSocket.OPEN || current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const ws = new WebSocket(`${WS_BASE}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        setReady(true);
      };

      ws.onmessage = (event) => {
        try {
          const data: WsEvent = JSON.parse(event.data);

          if (data.type === "auth_ok") {
            setReady(true);
            return;
          }

          const handlers = handlersRef.current.get(data.type);
          if (handlers) {
            handlers.forEach((h) => h(data.payload));
          }
        } catch {}
      };

      ws.onerror = () => {};
      ws.onclose = () => {
        setReady(false);
        if (wsRef.current === ws) wsRef.current = null;
        scheduleRetry();
      };
    };

    const onVisibility = () => {
      if (document.visibilityState !== "visible" || !mounted) return;
      const s = wsRef.current;
      if (!s || s.readyState === WebSocket.CLOSED || s.readyState === WebSocket.CLOSING) {
        if (retryTimer) {
          clearTimeout(retryTimer);
          retryTimer = null;
        }
        connect();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    connect();

    return () => {
      mounted = false;
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = null;
      document.removeEventListener("visibilitychange", onVisibility);
      const ws = wsRef.current;
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;
        ws.close();
        wsRef.current = null;
      }
    };
  }, []);

  return (
    <WsContext.Provider value={{ on, ready }}>
      {children}
    </WsContext.Provider>
  );
}

export function useWebSocket() {
  const ctx = useContext(WsContext);
  if (!ctx) throw new Error("useWebSocket must be used within WebSocketProvider");
  return ctx;
}

export function usePeerNotifications() {
  const { on } = useWebSocket();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    const unsub1 = on("peer_match", (payload) => {
      const { topic, grade, tutorName, learnerName } = payload as any;
      toast.success("Peer Match!", {
        description: `${tutorName} and ${learnerName} matched for ${topic} (${grade})`,
        duration: 8000,
      });
    });

    const unsub2 = on("peer_closed", (payload) => {
      const { topic } = payload as any;
      toast.info("Session Ended", {
        description: `Peer session for ${topic} has been closed.`,
      });
    });

    const unsub3 = on("new_message", (payload) => {
      if (pathnameRef.current.startsWith("/friends-chat")) return;
      const { senderName, senderId, content } = payload as any;
      toast(String(senderName || "New Message"), {
        description: content,
        action: { label: "Open", onClick: () => window.location.href = `/friends-chat?peer=${senderId}` },
        duration: 6000,
      });
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [on]);
}
