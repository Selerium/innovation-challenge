"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useWebSocket } from "@/lib/use-websocket";
import { useProfile } from "@/lib/profile-context";

type Conversation = {
  conversationId: string;
  status: string;
  peer: { id: string; displayName: string; avatarUrl: string | null } | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
};

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  sentAt: string;
};

export default function FriendsChatPage() {
  const searchParams = useSearchParams();
  const peerParam = searchParams.get("peer");
  const { profile } = useProfile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { on } = useWebSocket();
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  // Load conversations
  const loadConversations = useCallback(async () => {
    const r = await api<{ data: Conversation[] }>("/api/chat/conversations");
    if (r.success && r.data) {
      setConversations(r.data.data);
    }
    setLoadingConvs(false);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Auto-select conversation from query param
  useEffect(() => {
    if (!peerParam || conversations.length === 0) return;
    const match = conversations.find((c) => c.peer?.id === peerParam);
    if (match) setSelected(match);
  }, [peerParam, conversations]);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    const r = await api<{ data: Message[] }>(`/api/chat/${conversationId}/messages`);
    if (r.success && r.data) {
      setMessages(r.data.data);
    }
  }, []);

  useEffect(() => {
    if (selected) {
      loadMessages(selected.conversationId);
    }
  }, [selected, loadMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for new_message events
  useEffect(() => {
    const unsub = on("new_message", (payload) => {
      const msg = payload as any;
      const current = selectedRef.current;

      if (current && msg.conversationId === current.conversationId) {
        setMessages((prev) => [...prev, msg as Message]);
      }

      loadConversations();
    });

    return unsub;
  }, [on, loadConversations]);

  const handleSend = async () => {
    if (!input.trim() || !selected || sending) return;
    setSending(true);
    const r = await api<{ data: Message }>(`/api/chat/${selected.conversationId}/send`, {
      method: "POST",
      body: { content: input.trim() },
    });
    const message = r.data?.data;
    if (r.success && message) {
      setMessages((prev) => [...prev, message]);
      setInput("");
      loadConversations();
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
          {loadingConvs ? (
            <div className="p-4 text-sm text-muted-foreground">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No conversations yet. Start a peer tutoring session to chat.
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.conversationId}
                onClick={() => setSelected(conv)}
                className={`w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border/50 ${
                  selected?.conversationId === conv.conversationId ? "bg-secondary" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">
                    {conv.peer?.displayName ?? "Unknown"}
                    {conv.status === "CLOSED" && (
                      <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Closed
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {conv.unreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                    {conv.lastMessageAt && (
                      <span className="text-xs text-muted-foreground">{formatDate(conv.lastMessageAt)}</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {conv.lastMessage ?? "Matched for peer learning - say hi!"}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">{selected.peer?.displayName ?? "Unknown"}</h3>
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
            {selected.status === "CLOSED" ? (
              <div className="p-4 border-t border-border">
                <p className="text-center text-sm text-muted-foreground">
                  This conversation is closed.
                </p>
              </div>
            ) : (
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
            )}
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
