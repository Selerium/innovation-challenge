"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile-context";
import { api } from "@/lib/api";
import { PageLoading, EmptyState, ErrorState } from "@/components/ui/loading";
import { GradeSubmissionModal } from "../grade-submission-modal";

type Submission = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  subjectName: string | null;
  classId: string | null;
  className: string | null;
  studentName: string;
  content: string;
  questions?: { id: string; question: string; answer: string; points?: number }[];
  maxScore?: number;
  aiScore: number | null;
  aiFeedback: string | null;
  teacherScore: number | null;
  teacherComment: string | null;
  status: string;
  submittedAt: string;
};

export default function GradeAssignmentsPage() {
  const router = useRouter();
  const { user } = useProfile();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"needs" | "all">("needs");
  const [gradeTarget, setGradeTarget] = useState<{ classId: string; submission: Submission } | null>(null);
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [assignmentFilter, setAssignmentFilter] = useState<string | null>(null);

  useEffect(() => {
    if (user == null) return;
    if (user.role !== "TEACHER") {
      router.replace("/dashboard");
      return;
    }
    const qs = new URLSearchParams(window.location.search);
    setClassFilter(qs.get("classId"));
    setAssignmentFilter(qs.get("assignmentId"));
  }, [user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api<{ data: Submission[] }>("/api/teacher/submissions");
    if (result.success) {
      setSubmissions(result.data!.data);
    } else {
      setError(result.error || "Failed to load submissions.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const needsGrading = submissions.filter((s) => s.status !== "GRADED");
  const graded = submissions.filter((s) => s.status === "GRADED");

  const filtered = submissions.filter(
    (s) =>
      (!classFilter || s.classId === classFilter) &&
      (!assignmentFilter || s.assignmentId === assignmentFilter)
  );
  const filteredNeeds = filtered.filter((s) => s.status !== "GRADED");
  const shown = filter === "needs" ? filteredNeeds : filtered;

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Grade Assignments</h1>
          <p className="subheading text-muted-foreground mt-1">
            {assignmentFilter
              ? "Review this assignment's submissions and grade your students"
              : "Every assignment waiting for your grade, from your class students"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-secondary p-4">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{needsGrading.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Needs grading</div>
          </div>
          <div className="rounded-xl border border-border bg-secondary p-4">
            <div className="text-2xl font-bold text-success">{graded.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Graded</div>
          </div>
          <div className="rounded-xl border border-border bg-secondary p-4">
            <div className="text-2xl font-bold">{submissions.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Total submissions</div>
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nothing to grade here"
            description={
              assignmentFilter
                ? "No student submissions for this assignment yet. Share the class invite code so students can complete it."
                : "Assignments your class students submit for grading will show up here."
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("needs")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    filter === "needs"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-muted"
                  }`}
                >
                  Needs grading ({filteredNeeds.length})
                </button>
                <button
                  onClick={() => setFilter("all")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    filter === "all"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-muted"
                  }`}
                >
                  All ({filtered.length})
                </button>
              </div>
              {(classFilter || assignmentFilter) && (
                <button
                  onClick={() => {
                    setClassFilter(null);
                    setAssignmentFilter(null);
                    window.history.replaceState(null, "", "/teacher/grade-assignments");
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-border bg-secondary">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Assignment</th>
                    <th className="px-4 py-2.5 font-medium">Student</th>
                    <th className="px-4 py-2.5 font-medium">Class</th>
                    <th className="px-4 py-2.5 font-medium">Submitted</th>
                    <th className="px-4 py-2.5 font-medium">AI Score</th>
                    <th className="px-4 py-2.5 font-medium">Teacher Score</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shown.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <div className="truncate">{s.assignmentTitle}</div>
                        {s.maxScore ? (
                          <div className="text-xs text-muted-foreground">
                            {s.subjectName ?? ""} · {s.maxScore} marks
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">{s.studentName}</td>
                      <td className="px-4 py-3">{s.className ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(s.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td className="px-4 py-3">{s.aiScore ?? "—"}</td>
                      <td className="px-4 py-3">{s.teacherScore ?? "—"}</td>
                      <td className="px-4 py-3">
                        {s.status === "GRADED" ? (
                          <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs font-medium text-success">
                            Graded
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            Needs grading
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setGradeTarget({ classId: s.classId ?? "", submission: s })}
                          disabled={!s.classId}
                          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted disabled:opacity-40 transition-colors"
                        >
                          {s.status === "GRADED" ? "Regrade" : "Grade"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <GradeSubmissionModal
        classId={gradeTarget?.classId ?? ""}
        submission={gradeTarget?.submission ?? null}
        onClose={() => setGradeTarget(null)}
        onSaved={load}
      />
    </div>
  );
}
