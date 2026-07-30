import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import crypto from "crypto";
import { auth } from "./auth.ts";
import { prisma } from "./prisma.ts";

type WsEvent = {
  type: string;
  payload: Record<string, unknown>;
};

const tokenMap = new Map<string, string>(); // token → profileId

class WsManager {
  private wss: WebSocketServer | null = null;
  private connections = new Map<string, Set<WebSocket>>();

  init(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws) => {
      let profileId: string | null = null;

      ws.on("message", (raw) => {
        try {
          const data = JSON.parse(raw.toString());
          if (data.type === "auth") {
            const token = data.token as string;
            if (!token) return;

            const pid = tokenMap.get(token);
            if (!pid) return;

            tokenMap.delete(token);
            profileId = pid;

            if (!this.connections.has(profileId)) {
              this.connections.set(profileId, new Set());
            }
            this.connections.get(profileId)!.add(ws);

            ws.send(JSON.stringify({ type: "auth_ok" }));
          }
        } catch {}
      });

      const close = () => {
        if (profileId) {
          const conns = this.connections.get(profileId);
          if (conns) {
            conns.delete(ws);
            if (conns.size === 0) this.connections.delete(profileId);
          }
        }
      };

      ws.on("close", close);
      ws.on("error", close);
    });
  }

  createToken(profileId: string): string {
    const token = crypto.randomBytes(32).toString("hex");
    tokenMap.set(token, profileId);
    setTimeout(() => tokenMap.delete(token), 30_000);
    return token;
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
