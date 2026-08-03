"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useProfile } from "@/lib/profile-context";
import { PageLoading, ErrorState, EmptyState } from "@/components/ui/loading";

type Question = {
  id: string;
  question: string;
  answer: string;
};

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  subject: { name: string; grade: string };
  content: { questions: Question[] };
  createdAt: string;
  submission?: {
    content: string;
    status: string;
  } | null;
};

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { refreshProfile } = useProfile();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await api<{ data: Assignment }>(`/api/assignments/${id}`);
    if (result.success && result.data) {
      const a = result.data.data;
      setAssignment(a);
      if (a.submission) {
        setSubmitted(true);
        try {
          const saved = JSON.parse(a.submission.content);
          setAnswers(saved);
        } catch {}
      } else {
        const initial: Record<string, string> = {};
        for (const q of a.content.questions) {
          initial[q.id] = "";
        }
        setAnswers(initial);
      }
    } else {
      setError(result.error || "Failed to load this assignment.");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const filled = Object.entries(answers).filter(([, v]) => v.trim());
    if (filled.length === 0) {
      setError("Answer at least one question");
      return;
    }
    setError("");
    setSubmitting(true);
    const result = await api(`/api/assignments/${id}/submit`, {
      method: "POST",
      body: { answers },
    });
    setSubmitting(false);
    if (result.success) {
      setSubmitted(true);
      const xp = result.data?.data?.xp;
      if (xp && xp.xpAwarded > 0) {
        if (xp.leveledUp) {
          toast.success(`Level Up! You reached Level ${xp.level} · +${xp.xpAwarded} XP`);
        } else {
          toast.success(`+${xp.xpAwarded} XP earned from submitting your assignment`);
        }
        refreshProfile();
      }
    } else {
      setError(result.error || "Something went wrong submitting your answers.");
    }
  }

  if (loading) {
    return <PageLoading />;
  }

  if (error || !assignment) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <ErrorState
            message={error || "This assignment could not be found."}
            onRetry={() => {
              setAssignment(null);
              load();
            }}
          />
          <div className="mt-4 text-center">
            <Link href="/assignments" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              &larr; All assignments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const date = new Date(assignment.createdAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  const questions = assignment.content?.questions ?? [];

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-xl border border-border bg-secondary p-6">
          <Link href="/assignments" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            &larr; All assignments
          </Link>
          <div className="flex items-start justify-between mt-3">
            <div>
              <h1 className="text-3xl font-bold">{assignment.title}</h1>
              <p className="subheading text-muted-foreground mt-1">
                {assignment.subject.name} ({assignment.subject.grade})
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>{date}</div>
              {submitted && (
                <div className="mt-1 rounded-md bg-success/20 px-2.5 py-1 text-xs font-medium text-success">
                  Completed
                </div>
              )}
            </div>
          </div>
        </div>

        {questions.length > 0 ? (
          <form onSubmit={handleSubmit} className="space-y-4">
          {assignment.content.questions.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-border bg-secondary p-5">
              <label className="text-sm font-medium mb-2 block">
                {i + 1}. {q.question}
              </label>
              <textarea
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                disabled={submitted}
                rows={4}
                placeholder="Type your answer here..."
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 resize-y"
              />
              {submitted && (
                <div className="mt-3 rounded-lg bg-muted px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Correct answer:</p>
                  <p className="text-sm text-foreground">{q.answer}</p>
                </div>
              )}
            </div>
          ))}

          {!submitted && (
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Submitting..." : "Submit Answers"}
              </button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
          </form>
        ) : (
          <EmptyState
            title="No questions yet"
            description="This assignment was created without any questions. Try generating a new one from the subject page."
            action={
              <Link
                href="/subjects"
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Browse Subjects
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
