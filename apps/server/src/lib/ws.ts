import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.ts";
import { prisma } from "./prisma.ts";

type WsEvent = {
  type: string;
  payload: Record<string, unknown>;
};

class WsManager {
  private wss: WebSocketServer | null = null;
  private connections = new Map<string, Set<WebSocket>>();

  init(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", async (ws, req) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(req.headers),
        });
        if (!session?.user) {
          ws.close();
          return;
        }

        const profile = await prisma.profile.findUnique({
          where: { userId: session.user.id },
        });
        if (!profile) {
          ws.close();
          return;
        }

        const profileId = profile.id;

        if (!this.connections.has(profileId)) {
          this.connections.set(profileId, new Set());
        }
        this.connections.get(profileId)!.add(ws);

        ws.send(JSON.stringify({ type: "auth_ok" }));

        const close = () => {
          const conns = this.connections.get(profileId);
          if (conns) {
            conns.delete(ws);
            if (conns.size === 0) this.connections.delete(profileId);
          }
        };

        ws.on("close", close);
        ws.on("error", close);
      } catch {
        ws.close();
      }
    });
  }

  sendToProfile(profileId: string, event: WsEvent) {
    const conns = this.connections.get(profileId);
    if (!conns) return;
    const msg = JSON.stringify(event);
    for (const ws of conns) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    }
  }
}

export const wsManager = new WsManager();
