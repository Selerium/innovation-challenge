"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useProfile } from "@/lib/profile-context";
import { PageLoading, ErrorState } from "@/components/ui/loading";
import { GradeSubmissionModal } from "../grade-submission-modal";

type Student = {
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  xp: number;
  subjects: number;
  topicsMastered: number;
  avgAssignmentScore: number | null;
  burnoutScore: number | null;
  atRisk: boolean;
};

type Submission = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentName: string;
  content: string;
  aiScore: number | null;
  aiFeedback: string | null;
  teacherScore: number | null;
  teacherComment: string | null;
  status: string;
  submittedAt: string;
};

type StudentDetail = {
  profile: { displayName: string; avatarUrl: string | null; level: number; xp: number; bio: string | null };
  subjects: { id: string; name: string; grade: string; topicsTotal: number; topicsMastered: number; averageProgress: number }[];
  assignments: { id: string; title: string; subjectName: string; aiScore: number | null; teacherScore: number | null; status: string; submittedAt: string }[];
  burnoutAlerts: { id: string; score: number; message: string; resolved: boolean; createdAt: string }[];
};

export default function TeacherDashboard() {
  const router = useRouter();
  const { user } = useProfile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [students, setStudents] = useState<Record<string, Student[]>>({});
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandingId, setExpandingId] = useState<string | null>(null);
  const [autoClassId, setAutoClassId] = useState<string | null>(null);
  const [autoAssignmentId, setAutoAssignmentId] = useState<string | null>(null);
  const [gradeTarget, setGradeTarget] = useState<{ classId: string; submission: Submission } | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    const result = await api("/api/teacher/analytics");
    if (result.success) setAnalytics(result.data.data);
    else setError(result.error || "Failed to load teacher analytics.");
    setLoading(false);
  };

  useEffect(() => {
    if (user?.role !== "TEACHER") {
      router.push("/dashboard");
      return;
    }
    const qs = new URLSearchParams(window.location.search);
    const cid = qs.get("classId");
    if (cid) {
      setAutoClassId(cid);
      setAutoAssignmentId(qs.get("assignmentId"));
    }
    loadAll();
  }, [router, user]);

  useEffect(() => {
    if (autoClassId && analytics.length > 0 && expanded !== autoClassId) {
      toggleClass(autoClassId);
    }
  }, [autoClassId, analytics, expanded]);

  async function toggleClass(classId: string) {
    if (expanded === classId) {
      setExpanded(null);
      return;
    }
    setExpanded(classId);
    if (!students[classId]) {
      setExpandingId(classId);
      const [s, sub] = await Promise.all([
        api(`/api/teacher/classes/${classId}/students`),
        api(`/api/teacher/classes/${classId}/submissions`),
      ]);
      if (s.success) setStudents((prev) => ({ ...prev, [classId]: s.data.data }));
      if (sub.success) setSubmissions((prev) => ({ ...prev, [classId]: sub.data.data }));
      setExpandingId(null);
    }
  }

  async function openStudent(profileId: string) {
    setDetailLoading(true);
    const result = await api(`/api/teacher/students/${profileId}`);
    if (result.success) setDetail(result.data.data);
    setDetailLoading(false);
  }

  function openGrade(classId: string, s: Submission) {
    setGradeTarget({ classId, submission: s });
  }

  async function handleGradeSaved() {
    if (!gradeTarget) return;
    const cid = gradeTarget.classId;
    const [sub, an] = await Promise.all([
      api(`/api/teacher/classes/${cid}/submissions${autoAssignmentId ? `?assignmentId=${autoAssignmentId}` : ""}`),
      api("/api/teacher/analytics"),
    ]);
    if (sub.success) setSubmissions((prev) => ({ ...prev, [cid]: sub.data.data }));
    if (an.success) setAnalytics(an.data.data);
  }

  const detailBody = detail ? (
    <>
      {detail.profile.bio && <p className="text-sm text-muted-foreground mb-4">{detail.profile.bio}</p>}

      <h3 className="text-sm font-semibold mb-2">Burnout Alerts</h3>
      {detail.burnoutAlerts.length > 0 ? (
        <div className="space-y-2 mb-5">
          {detail.burnoutAlerts.map((b) => (
            <div
              key={b.id}
              className={`rounded-lg border p-3 text-sm ${
                b.resolved
                  ? "border-border bg-muted/40 text-muted-foreground"
                  : "border-amber-500/40 bg-amber-500/10"
              }`}
            >
              <div className="font-medium">
                {b.score}% {b.resolved && "(resolved)"}
              </div>
              <div className="text-xs mt-0.5">{b.message}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-5">No burnout alerts.</p>
      )}

      <h3 className="text-sm font-semibold mb-2">Subjects</h3>
      <div className="space-y-2 mb-5">
        {detail.subjects.map((s) => (
          <div key={s.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{s.name}</span>
              <span className="text-xs text-muted-foreground">{s.grade}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${s.averageProgress}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {s.topicsMastered} / {s.topicsTotal} topics mastered · {s.averageProgress}%
            </div>
          </div>
        ))}
        {detail.subjects.length === 0 && (
          <p className="text-sm text-muted-foreground">No subjects yet.</p>
        )}
      </div>

      <h3 className="text-sm font-semibold mb-2">Assignments</h3>
      <div className="space-y-2">
        {detail.assignments.map((a) => (
          <div key={a.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium truncate">{a.title}</span>
              <span className="text-xs text-muted-foreground">{a.subjectName}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              AI: {a.aiScore ?? "—"} · Teacher: {a.teacherScore ?? "—"} · {a.status.replace(/_/g, " ")}
            </div>
          </div>
        ))}
        {detail.assignments.length === 0 && (
          <p className="text-sm text-muted-foreground">No assignments yet.</p>
        )}
      </div>
    </>
  ) : null;

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-1">Teacher Dashboard</h1>
        <p className="subheading text-muted-foreground mb-8">
          Class analytics, submissions, and student progress
        </p>

        {error && <ErrorState message={error} onRetry={loadAll} className="mb-6" />}

        {!error && analytics.length === 0 ? (
          <div className="rounded-xl border border-border bg-secondary p-12 text-center">
            <p className="text-sm text-muted-foreground">
              You don't have any classes yet. Create one from the Classes page to start tracking students.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {analytics.map((a) => (
              <div key={a.class.id} className="rounded-xl border border-border bg-secondary overflow-hidden">
                <button
                  onClick={() => toggleClass(a.class.id)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold">{a.class.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.class.memberCount} students · {a.submissions} submissions
                    </p>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="hidden sm:flex items-center gap-5 text-sm">
                      <div className="text-center">
                        <div className="font-bold">{a.avgAiScore ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">Avg AI Score</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{a.avgTeacherScore ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">Avg Teacher Score</div>
                      </div>
                      <div className={`text-center ${a.atRiskCount > 0 ? "text-amber-500 dark:text-amber-400" : ""}`}>
                        <div className="font-bold">{a.atRiskCount}</div>
                        <div className="text-xs text-muted-foreground">At Risk</div>
                      </div>
                    </div>
                    <span className="text-xs text-primary font-medium">
                      {expanded === a.class.id ? "Hide" : "View"} &rarr;
                    </span>
                  </div>
                </button>

                {expanded === a.class.id && (
                  <div className="border-t border-border p-5">
                    <h4 className="text-sm font-semibold mb-3">Students</h4>
                    {students[a.class.id]?.length ? (
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                            <tr>
                              <th className="px-4 py-2.5 font-medium">Student</th>
                              <th className="px-4 py-2.5 font-medium">Level</th>
                              <th className="px-4 py-2.5 font-medium">Subjects</th>
                              <th className="px-4 py-2.5 font-medium">Mastered</th>
                              <th className="px-4 py-2.5 font-medium">Avg Score</th>
                              <th className="px-4 py-2.5 font-medium">Burnout</th>
                              <th className="px-4 py-2.5 font-medium"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {students[a.class.id].map((st) => (
                              <tr key={st.profileId} className="hover:bg-muted/50 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                                      {st.displayName?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                    <span className="font-medium">{st.displayName}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">{st.level}</td>
                                <td className="px-4 py-3">{st.subjects}</td>
                                <td className="px-4 py-3">{st.topicsMastered}</td>
                                <td className="px-4 py-3">{st.avgAssignmentScore ?? "—"}</td>
                                <td className="px-4 py-3">
                                  {st.burnoutScore != null ? (
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                        st.atRisk
                                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                      }`}
                                    >
                                      {st.burnoutScore}% {st.atRisk ? "· at risk" : ""}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => openStudent(st.profileId)}
                                    disabled={detailLoading}
                                    className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50 transition-colors"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">No students yet.</p>
                    )}

                    <h4 className="text-sm font-semibold mt-6 mb-3">Submissions</h4>
                    {autoAssignmentId && (
                      <p className="text-xs text-muted-foreground mb-3">
                        Showing submissions for the selected assignment only.
                      </p>
                    )}
                    {submissions[a.class.id]?.length ? (
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                            <tr>
                              <th className="px-4 py-2.5 font-medium">Assignment</th>
                              <th className="px-4 py-2.5 font-medium">Student</th>
                              <th className="px-4 py-2.5 font-medium">AI Score</th>
                              <th className="px-4 py-2.5 font-medium">Teacher Score</th>
                              <th className="px-4 py-2.5 font-medium">Status</th>
                              <th className="px-4 py-2.5 font-medium"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {submissions[a.class.id]
                              .filter((s) => !autoAssignmentId || s.assignmentId === autoAssignmentId)
                              .map((s) => (
                                <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                                  <td className="px-4 py-3 font-medium">{s.assignmentTitle}</td>
                                  <td className="px-4 py-3">{s.studentName}</td>
                                  <td className="px-4 py-3">{s.aiScore ?? "—"}</td>
                                  <td className="px-4 py-3">{s.teacherScore ?? "—"}</td>
                                  <td className="px-4 py-3">
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                                      {s.status.replace(/_/g, " ")}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      onClick={() => openGrade(a.class.id, s)}
                                      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
                                    >
                                      {s.teacherScore != null ? "Regrade" : "Grade"}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">No submissions yet.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {(detailLoading || detail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">
                  {detailLoading ? "Loading..." : detail!.profile.displayName}
                </h2>
                {!detailLoading && (
                  <p className="subheading text-muted-foreground text-sm mt-0.5">
                    Level {detail!.profile.level} · {detail!.profile.xp} XP
                  </p>
                )}
              </div>
              <button
                onClick={() => setDetail(null)}
                className="text-muted-foreground hover:text-foreground text-lg"
              >
                &times;
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                Loading student details...
              </div>
            ) : (
              detailBody
            )}
          </div>
        </div>
      )}

      <GradeSubmissionModal
        classId={gradeTarget?.classId ?? ""}
        submission={gradeTarget?.submission ?? null}
        onClose={() => setGradeTarget(null)}
        onSaved={handleGradeSaved}
      />
    </div>
  );
}
