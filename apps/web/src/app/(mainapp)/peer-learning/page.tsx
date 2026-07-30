"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Subject = {
  id: string;
  name: string;
  grade: string;
};

type TutorProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

type TutoringEntry = {
  id: string;
  type: "TEACH" | "LEARN";
  topic: string;
  grade: string | null;
  status: "OPEN" | "MATCHED" | "CLOSED";
  createdAt: string;
  pairedId: string | null;
  tutorId: string | null;
  requester: TutorProfile;
  tutor: TutorProfile | null;
  paired?: TutoringEntry | null;
};

export default function PeerLearningPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [entries, setEntries] = useState<TutoringEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Teach form
  const [teachSubject, setTeachSubject] = useState("");
  const [teachGrade, setTeachGrade] = useState("");
  const [offering, setOffering] = useState(false);

  // Learn form
  const [learnSubject, setLearnSubject] = useState("");
  const [learnGrade, setLearnGrade] = useState("");
  const [requesting, setRequesting] = useState(false);

  const loadSubjects = useCallback(async () => {
    const result = await api<{ data: Subject[] }>("/api/subjects");
    if (result.success) setSubjects(result.data!.data);
  }, []);

  const loadEntries = useCallback(async () => {
    const result = await api<{ data: TutoringEntry[] }>("/api/tutoring/my");
    if (result.success) setEntries(result.data!.data);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadSubjects(), loadEntries()]);
    setLoading(false);
  }, [loadSubjects, loadEntries]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const uniqueSubjects = subjects.filter(
    (s, i, a) => a.findIndex((x) => x.name === s.name && x.grade === s.grade) === i
  );

  async function handleOffer() {
    if (!teachSubject || offering) return;
    setOffering(true);
    await api("/api/tutoring/offer", {
      method: "POST",
      body: { topic: teachSubject, grade: teachGrade },
    });
    setOffering(false);
    await loadEntries();
  }

  async function handleRequest() {
    if (!learnSubject || requesting) return;
    setRequesting(true);
    await api("/api/tutoring/request", {
      method: "POST",
      body: { topic: learnSubject, grade: learnGrade },
    });
    setRequesting(false);
    await loadEntries();
  }

  async function handleClose(id: string) {
    await api(`/api/tutoring/${id}/close`, { method: "POST" });
    await loadEntries();
  }

  const openTeach = entries.filter((e) => e.type === "TEACH" && e.status === "OPEN");
  const openLearn = entries.filter((e) => e.type === "LEARN" && e.status === "OPEN");
  const matched = entries.filter((e) => e.status === "MATCHED");

  const matchedSessions = matched.map((e) => {
    const paired = entries.find((x) => x.id === e.pairedId);
    const otherName =
      e.type === "TEACH"
        ? e.pairedId
          ? paired?.requester?.displayName || "Learner"
          : null
        : e.tutor?.displayName || paired?.requester?.displayName || null;
    const otherId =
      e.type === "TEACH"
        ? paired?.requester?.id || null
        : e.tutor?.id || paired?.requester?.id || null;
    return { ...e, otherName, otherId };
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Peer Learning</h1>
          <p className="subheading text-muted-foreground mt-1">Learn together with classmates</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Teach Card */}
          <div className="rounded-xl border border-border bg-secondary p-6">
            <h2 className="text-lg font-semibold mb-1">Teach</h2>
            <p className="text-sm text-muted-foreground mb-4">Offer to help others in subjects you know</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
                <Select
                  value={teachSubject || null}
                  onValueChange={(v) => {
                    if (!v) { setTeachSubject(""); setTeachGrade(""); return; }
                    const [name, grade] = v.split("||");
                    setTeachSubject(name);
                    setTeachGrade(grade);
                  }}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select subject..." />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueSubjects.map((s) => (
                      <SelectItem key={s.id} value={`${s.name}||${s.grade}`}>
                        {s.name} — {s.grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {teachSubject && (
                <div className="text-xs text-muted-foreground">
                  Grade: {teachGrade}
                </div>
              )}

              <button
                onClick={handleOffer}
                disabled={!teachSubject || offering}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {offering ? "Offering..." : "Go Available"}
              </button>
            </div>

            {openTeach.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Your offers ({openTeach.length})
                </h3>
                <div className="space-y-1.5">
                  {openTeach.map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                      <div>
                        <span className="text-sm font-medium">{e.topic}</span>
                        {e.grade && <span className="text-xs text-muted-foreground ml-1">{e.grade}</span>}
                      </div>
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Waiting
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Learn Card */}
          <div className="rounded-xl border border-border bg-secondary p-6">
            <h2 className="text-lg font-semibold mb-1">Learn</h2>
            <p className="text-sm text-muted-foreground mb-4">Get help from classmates on any subject</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
                <Select
                  value={learnSubject || null}
                  onValueChange={(v) => {
                    if (!v) { setLearnSubject(""); setLearnGrade(""); return; }
                    const [name, grade] = v.split("||");
                    setLearnSubject(name);
                    setLearnGrade(grade);
                  }}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select subject..." />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueSubjects.map((s) => (
                      <SelectItem key={s.id} value={`${s.name}||${s.grade}`}>
                        {s.name} — {s.grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {learnSubject && (
                <div className="text-xs text-muted-foreground">
                  Grade: {learnGrade}
                </div>
              )}

              <button
                onClick={handleRequest}
                disabled={!learnSubject || requesting}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {requesting ? "Requesting..." : "Find Help"}
              </button>
            </div>

            {openLearn.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Waiting for tutor ({openLearn.length})
                </h3>
                <div className="space-y-1.5">
                  {openLearn.map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                      <div>
                        <span className="text-sm font-medium">{e.topic}</span>
                        {e.grade && <span className="text-xs text-muted-foreground ml-1">{e.grade}</span>}
                      </div>
                      <span className="rounded-md bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                        Queued
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Sessions */}
        {matchedSessions.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Active Sessions</h2>
            <div className="space-y-2">
              {matchedSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-secondary px-5 py-4"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {s.topic}{s.grade ? ` (${s.grade})` : ""}
                    </div>
                    {s.otherName && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {s.type === "TEACH" ? "Tutoring" : "Learning with"} {s.otherName}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/friends-chat?peer=${s.otherId || ""}`}
                      className="rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      Chat
                    </Link>
                    <button
                      onClick={() => handleClose(s.id)}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                      End
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
