"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AddSubjectModal } from "@/components/subjects/add-subject-modal";
import { PageLoading, EmptyState, ErrorState } from "@/components/ui/loading";

type Subject = {
  id: string;
  name: string;
  grade: string;
  scope: string | null;
  topic: { id: string; name: string; status: string; progress: number }[];
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api<{ data: Subject[] }>("/api/subjects");
    if (result.success) {
      setSubjects(result.data!.data);
    } else {
      setError(result.error || "Failed to load subjects.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Subjects</h1>
            <p className="subheading text-muted-foreground mt-1">Manage your subjects and topics</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + Add Subject
          </button>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : subjects.length === 0 ? (
          <EmptyState
            title="No subjects yet"
            description="Add a subject to start learning with the AI tutor."
            action={
              <button
                onClick={() => setModalOpen(true)}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Add Your First Subject
              </button>
            }
          />
        ) : (
          <div className="grid gap-4">
            {subjects.map((subject) => (
              <Link
                key={subject.id}
                href={`/subjects/${subject.id}`}
                className="block rounded-xl border border-border bg-secondary p-5 hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">{subject.name}</h3>
                    <p className="text-sm text-muted-foreground">{subject.grade}{subject.scope ? ` · ${subject.scope}` : ""}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{subject.topic.length} topics</span>
                </div>
                {subject.topic.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {subject.topic.map((t) => (
                      <span
                        key={t.id}
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          t.status === "MASTERED"
                            ? "bg-success/20 text-success"
                            : t.status === "IN_PROGRESS"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        <AddSubjectModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={load} />
      </div>
    </div>
  );
}
