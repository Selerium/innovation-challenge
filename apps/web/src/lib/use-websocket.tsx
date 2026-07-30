"use client";

import { createContext, useContext, useEffect, useRef, useCallback, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { api } from "./api";

type WsEvent = {
  type: string;
  payload: Record<string, unknown>;
};

type Handler = (payload: Record<string, unknown>) => void;

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000";

type WsContextValue = {
  on: (eventType: string, handler: Handler) => () => void;
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

    async function connect() {
      try {
        const result = await api<{ token: string }>("/api/auth/ws-token");
        if (!result.success || !result.data?.token) return;

        const ws = new WebSocket(`${WS_BASE}/ws`);
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: "auth", token: result.data!.token }));
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
          wsRef.current = null;
          if (mounted) setTimeout(connect, 5000);
        };
      } catch {}
    }

    connect();

    return () => {
      mounted = false;
      wsRef.current?.close();
    };
  }, []);

  return (
    <WsContext.Provider value={{ on }}>
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
      const { senderId } = payload as any;
      toast("New Message", {
        description: "You received a new message",
        action: { label: "Open", onClick: () => window.location.href = "/friends-chat" },
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
