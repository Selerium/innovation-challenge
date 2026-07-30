"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useWebSocket } from "@/lib/use-websocket";

type Peer = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  sentAt: string;
};

type Profile = {
  id: string;
  displayName: string;
};

export default function FriendsChatPage() {
  const searchParams = useSearchParams();
  const peerParam = searchParams.get("peer");
  const [peers, setPeers] = useState<Peer[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<Peer | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingPeers, setLoadingPeers] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { on } = useWebSocket();
  const selectedPeerRef = useRef(selectedPeer);
  selectedPeerRef.current = selectedPeer;

  // Load current profile
  useEffect(() => {
    api("/api/session").then((r: any) => {
      if (r.success && r.data?.profile) setProfile(r.data.profile);
    });
  }, []);

  // Load conversations
  const loadPeers = useCallback(async () => {
    const r = await api<Peer[]>("/api/chat/conversations");
    if (r.success && r.data) {
      setPeers(r.data);
    }
    setLoadingPeers(false);
  }, []);

  useEffect(() => { loadPeers(); }, [loadPeers]);

  // Auto-select peer from query param
  useEffect(() => {
    if (!peerParam || peers.length === 0) return;
    const match = peers.find((p) => p.id === peerParam);
    if (match) setSelectedPeer(match);
  }, [peerParam, peers]);

  // Load messages for selected peer
  const loadMessages = useCallback(async (peerId: string) => {
    const r = await api<Message[]>(`/api/chat/${peerId}`);
    if (r.success && r.data) {
      setMessages(r.data);
    }
  }, []);

  useEffect(() => {
    if (selectedPeer) {
      loadMessages(selectedPeer.id);
    }
  }, [selectedPeer, loadMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for new_message events
  useEffect(() => {
    const unsub = on("new_message", (payload) => {
      const msg = payload as any;
      const currentPeer = selectedPeerRef.current;

      // If currently viewing the sender's chat, append message
      if (currentPeer && msg.senderId === currentPeer.id) {
        setMessages((prev) => [...prev, msg as Message]);
      }

      // Reload peers to update last message / unread count
      loadPeers();
    });

    return unsub;
  }, [on, loadPeers]);

  const handleSend = async () => {
    if (!input.trim() || !selectedPeer || sending) return;
    setSending(true);
    const r = await api(`/api/chat/${selectedPeer.id}/send`, {
      method: "POST",
      body: { content: input.trim() },
    });
    if (r.success && r.data) {
      setMessages((prev) => [...prev, r.data as Message]);
      setInput("");
      loadPeers();
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return formatTime(iso);
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Conversations</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingPeers ? (
            <div className="p-4 text-sm text-muted-foreground">Loading...</div>
          ) : peers.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No conversations yet. Start a peer tutoring session to chat.
            </div>
          ) : (
            peers.map((peer) => (
              <button
                key={peer.id}
                onClick={() => setSelectedPeer(peer)}
                className={`w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border/50 ${
                  selectedPeer?.id === peer.id ? "bg-secondary" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">{peer.displayName}</span>
                  <div className="flex items-center gap-2">
                    {peer.unreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {peer.unreadCount}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{formatDate(peer.lastMessageAt)}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{peer.lastMessage}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedPeer ? (
          <>
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">{selectedPeer.displayName}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center pt-8">No messages yet. Say hello!</p>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === profile?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-xl px-4 py-2 text-sm ${
                          isMine
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground"
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {formatTime(msg.sentAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
                >
                  {sending ? "..." : "Send"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
