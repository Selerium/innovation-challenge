"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useWebSocket } from "@/lib/use-websocket";
import { useProfile } from "@/lib/profile-context";

type Conversation = {
  conversationId: string;
  status: string;
  source: string;
  peer: { id: string; displayName: string; avatarUrl: string | null } | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
};

type Peer = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  classes: string[];
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
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Peer[]>([]);
  const [searching, setSearching] = useState(false);
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
    setLoadingMessages(true);
    const r = await api<{ data: Message[] }>(`/api/chat/${conversationId}/messages`);
    if (r.success && r.data) {
      setMessages(r.data.data);
    }
    setLoadingMessages(false);
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

  // Listen for conversation_closed events (peer closed the chat)
  useEffect(() => {
    const unsub = on("conversation_closed", (payload) => {
      const { conversationId } = payload as any;
      setSelected((s) =>
        s && s.conversationId === conversationId ? { ...s, status: "CLOSED" } : s
      );
      setConversations((prev) =>
        prev.map((c) => (c.conversationId === conversationId ? { ...c, status: "CLOSED" } : c))
      );
    });
    return unsub;
  }, [on]);

  // Debounced search for classmates
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      const r = await api<{ data: Peer[] }>(`/api/chat/peers?q=${encodeURIComponent(q)}`);
      if (r.success && r.data) setSearchResults(r.data.data);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleAdd = async (peer: Peer) => {
    const r = await api<{ data: Conversation }>("/api/chat/start", {
      method: "POST",
      body: { peerId: peer.id },
    });
    if (r.success && r.data) {
      const conv = r.data.data;
      toast.success(`Started a chat with ${peer.displayName}`);
      setSearchQuery("");
      setSearchResults([]);
      await loadConversations();
      setSelected(conv);
    } else {
      toast.error(r.error || "Could not start the chat.");
    }
  };

  const handleClose = async () => {
    if (!selected) return;
    if (!window.confirm("Close this chat? You can start a new one with them later.")) return;
    const r = await api(`/api/chat/${selected.conversationId}/close`, { method: "POST" });
    if (r.success) {
      toast.success("Chat closed");
      setSelected((s) => (s ? { ...s, status: "CLOSED" } : s));
      loadConversations();
    } else {
      toast.error(r.error || "Could not close the chat.");
    }
  };

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
    } else {
      toast.error(r.error || "Could not send your message.");
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
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <h1 className="text-3xl font-bold">Friends Chat</h1>
        <p className="subheading text-muted-foreground mt-1">Chat with classmates and tutoring partners</p>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-80 border-r border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <div className="mt-3">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search classmates..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {searchQuery.trim() && (
              <div className="mt-2 rounded-lg border border-border bg-background max-h-48 overflow-y-auto">
                {searching ? (
                  <div className="p-3 text-xs text-muted-foreground">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="p-3 text-xs text-muted-foreground">No users found</div>
                ) : (
                  searchResults.map((peer) => (
                    <div
                      key={peer.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/50 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{peer.displayName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {peer.classes.join(", ")}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAdd(peer)}
                        className="shrink-0 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                Loading...
              </div>
            ) : conversations.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No conversations yet. Search for a classmate above to start chatting.
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
                    {conv.source === "PEER_TUTORING" && (
                      <span className="ml-2 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Peer learning
                      </span>
                    )}
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
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">{selected.peer?.displayName ?? "Unknown"}</h3>
              {selected.status === "ACTIVE" && (
                <button
                  onClick={handleClose}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  Close chat
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center gap-2 pt-8 text-sm text-muted-foreground">
                  <span className="inline-block size-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
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
    </div>
  );
}
