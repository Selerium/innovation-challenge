"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useStudySession } from "@/lib/use-study-session";

type Suggestion = {
  name: string;
  description: string;
  connection: string;
};

type Topic = {
  id: string;
  name: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "MASTERED";
  progress: number;
  explanation: string | null;
  suggestions: Suggestion[] | null;
};

type SubjectData = {
  id: string;
  name: string;
  grade: string;
  scope: string | null;
  topic: Topic[];
};

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  topicId?: string;
};

const statusLabel = { NOT_STARTED: "Not Started", IN_PROGRESS: "In Progress", MASTERED: "Mastered" };
const statusColor = {
  NOT_STARTED: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-primary/10 text-primary",
  MASTERED: "bg-success/20 text-success",
};

export default function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [subject, setSubject] = useState<SubjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { markActive, running, activeMinutes, endSession } = useStudySession({
    enabled: !!subject && !!selectedTopicId,
    topicId: selectedTopicId,
  });

  const loadSubject = useCallback(async () => {
    const result = await api<{ data: SubjectData }>(`/api/subjects/${id}`);
    if (result.success && result.data) {
      setSubject(result.data.data);
    }
    setLoading(false);
  }, [id]);

  const loadHistory = useCallback(async (topicId: string | null) => {
    const params = topicId ? `?topicId=${topicId}` : "";
    const result = await api<{ data: { messages: ChatMsg[] } }>(`/api/ai/history/${id}${params}`);
    if (result.success && result.data) {
      setMessages(result.data.data.messages);
    }
  }, [id]);

  useEffect(() => { loadSubject(); }, [loadSubject]);

  useEffect(() => {
    if (subject) {
      if (!selectedTopicId && subject.topic.length > 0) {
        setSelectedTopicId(subject.topic[0].id);
      }
    }
  }, [subject, selectedTopicId]);

  useEffect(() => {
    if (selectedTopicId) loadHistory(selectedTopicId);
    else setMessages([]);
  }, [selectedTopicId, loadHistory]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !selectedTopicId || sending) return;

    markActive();
    setSending(true);
    const userMsg = chatInput.trim();
    setChatInput("");

    const optimistic: ChatMsg = { role: "user", content: userMsg, timestamp: new Date().toISOString(), topicId: selectedTopicId };
    setMessages((prev) => [...prev, optimistic]);

    const result = await api<{ data: { response: string } }>("/api/ai/chat", {
      method: "POST",
      body: { subjectId: id, message: userMsg, topicId: selectedTopicId },
    });

    setSending(false);

    if (result.success && result.data) {
      const reply: ChatMsg = { role: "assistant", content: result.data.data.response, timestamp: new Date().toISOString(), topicId: selectedTopicId };
      setMessages((prev) => [...prev, reply]);
    }
  }

  async function handleExplain() {
    if (!selectedTopicId || explaining) return;
    markActive();
    setExplaining(true);
    const result = await api<{ data: { explanation: string } }>("/api/ai/deep-dive", {
      method: "POST",
      body: { subjectId: id, topicId: selectedTopicId },
    });
    setExplaining(false);
    if (result.success && result.data) {
      setSubject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          topic: prev.topic.map((t) =>
            t.id === selectedTopicId ? { ...t, explanation: result.data!.data.explanation } : t
          ),
        };
      });
    }
  }

  async function handleSuggest() {
    if (!selectedTopicId || suggesting) return;
    markActive();
    setSuggesting(true);
    const result = await api<{ data: { suggestions: Suggestion[] } }>("/api/ai/suggest-topics", {
      method: "POST",
      body: { subjectId: id, topicId: selectedTopicId },
    });
    setSuggesting(false);
    if (result.success && result.data) {
      setSubject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          topic: prev.topic.map((t) =>
            t.id === selectedTopicId ? { ...t, suggestions: result.data!.data.suggestions } : t
          ),
        };
      });
    }
  }

  async function handleGenerate() {
    if (!selectedTopicId || generating) return;
    markActive();
    setGenerating(true);
    const result = await api<{ data: { id: string } }>("/api/assignments/generate", {
      method: "POST",
      body: { subjectId: id, topicId: selectedTopicId },
    });
    setGenerating(false);
    if (result.success && result.data) {
      router.push(`/assignments/${result.data.data.id}`);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">Subject not found</div>
      </div>
    );
  }

  const selectedTopic = subject.topic.find((t) => t.id === selectedTopicId);
  const topicMessages = messages.filter((m) => m.topicId === selectedTopicId);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Subject info card */}
        <div className="rounded-xl border border-border bg-secondary p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{subject.name}</h1>
              <p className="subheading text-muted-foreground mt-1">
                {subject.grade}{subject.scope ? ` · ${subject.scope}` : ""}
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>{subject.topic.length} topics</div>
              <div>{subject.topic.filter((t) => t.status === "MASTERED").length} mastered</div>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6">
          {/* Left: Topics list */}
          <div className="w-72 shrink-0">
            <div className="rounded-xl border border-border bg-secondary p-4">
              <h2 className="font-semibold mb-3">Topics</h2>
              <div className="space-y-1">
                {subject.topic.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      markActive();
                      setSelectedTopicId(t.id);
                    }}
                    className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      selectedTopicId === t.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{t.name}</span>
                      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${statusColor[t.status]}`}>
                        {t.progress}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Chat + Topic Info */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Chat */}
            <div className="rounded-xl border border-border bg-secondary">
              <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                <h2 className="font-semibold">
                  {selectedTopic ? selectedTopic.name : "Chat"}
                </h2>
                {running && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                      Studying{activeMinutes > 0 ? ` · ${activeMinutes}m` : ""}
                    </span>
                    <button
                      onClick={() => endSession()}
                      className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      End
                    </button>
                  </div>
                )}
              </div>

              <div className="h-80 overflow-y-auto space-y-3 p-4">
                {topicMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center pt-8">
                    Ask a question about {selectedTopic?.name || "this subject"}
                  </p>
                ) : (
                  topicMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-4">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => {
                    markActive();
                    setChatInput(e.target.value);
                  }}
                  placeholder={`Ask about ${selectedTopic?.name || "this subject"}...`}
                  disabled={sending}
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || sending || !selectedTopicId}
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {sending ? "..." : "Send"}
                </button>
              </form>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleExplain}
                disabled={!selectedTopicId || explaining}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
              >
                {explaining ? "Explaining..." : "Explain"}
              </button>
              <button
                onClick={handleSuggest}
                disabled={!selectedTopicId || suggesting}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
              >
                {suggesting ? "Suggesting..." : "Suggest"}
              </button>
              <button
                onClick={handleGenerate}
                disabled={!selectedTopicId || generating}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
              >
                {generating ? "Generating..." : "Assignment"}
              </button>
            </div>

            {/* Topic Explanation + Next Topics */}
            {selectedTopic && (
              <div className="rounded-xl border border-border bg-secondary p-5 space-y-4">
                {selectedTopic.explanation ? (
                  <div>
                    <h3 className="font-semibold mb-2">{selectedTopic.name}</h3>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTopic.explanation}</p>
                  </div>
                ) : null}
                {selectedTopic.suggestions && selectedTopic.suggestions.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Suggested next topics:</h4>
                    <ol className="space-y-2">
                      {selectedTopic.suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                            {i + 1}
                          </span>
                          <div>
                            <span className="font-medium text-foreground">{s.name}</span>
                            <p>{s.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.connection}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}
                {!selectedTopic.explanation && (!selectedTopic.suggestions || selectedTopic.suggestions.length === 0) ? (
                  <div>
                    <h3 className="font-semibold mb-3">{selectedTopic.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Click "Explain This Topic" for a detailed breakdown, or "Suggest Next Topics" to see what to study next.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
