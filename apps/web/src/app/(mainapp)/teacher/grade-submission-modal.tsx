"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export type GradeableSubmission = {
  id: string;
  assignmentTitle: string;
  studentName: string;
  content: string;
  aiScore: number | null;
  aiFeedback: string | null;
  teacherScore: number | null;
  teacherComment: string | null;
  questions?: { id: string; question: string; answer: string; points?: number }[];
  maxScore?: number;
};

type Props = {
  classId: string;
  submission: GradeableSubmission | null;
  onClose: () => void;
  onSaved: () => void;
};

type ParsedAnswers = Record<string, string>;

function parseAnswers(content: string): ParsedAnswers {
  try {
    const parsed = JSON.parse(content);
    return typeof parsed === "object" && parsed !== null ? (parsed as ParsedAnswers) : {};
  } catch {
    return {};
  }
}

export function GradeSubmissionModal({ classId, submission, onClose, onSaved }: Props) {
  const [score, setScore] = useState("");
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (submission) {
      setComment(submission.teacherComment ?? "");
      setSaving(false);
      const qs = submission.questions ?? [];
      if (qs.length > 0) {
        const init: Record<string, string> = {};
        for (const q of qs) init[q.id] = "";
        setMarks(init);
        setScore("");
      } else {
        setScore(submission.teacherScore != null ? String(submission.teacherScore) : "");
        setMarks({});
      }
    }
  }, [submission]);

  if (!submission) return null;
  const target = submission;

  const answers = parseAnswers(target.content);
  const questions = target.questions ?? [];
  const maxScore = target.maxScore ?? questions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);

  const totalMarks = questions.reduce(
    (sum, q) => sum + Math.min(Math.max(Number(marks[q.id]) || 0, 0), Number(q.points) || 1),
    0
  );
  const percent = maxScore > 0 ? Math.round((totalMarks / maxScore) * 100) : null;

  async function handleSave() {
    let teacherScore: number;

    if (questions.length > 0) {
      for (const q of questions) {
        const raw = marks[q.id];
        if (raw == null || raw === "") {
          toast.error("Enter a mark for every question");
          return;
        }
        const value = Number(raw);
        const points = Number(q.points) || 1;
        if (Number.isNaN(value) || value < 0 || value > points) {
          toast.error(`Marks for each question must be between 0 and ${points}`);
          return;
        }
      }
      teacherScore = percent ?? 0;
    } else {
      const parsed = Number(score);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
        toast.error("Score must be between 0 and 100");
        return;
      }
      teacherScore = parsed;
    }

    setSaving(true);
    const result = await api(`/api/teacher/classes/${classId}/submissions/${target.id}/grade`, {
      method: "POST",
      body: { teacherScore, teacherComment: comment },
    });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error || "Failed to save grade");
      return;
    }
    toast.success("Grade saved");
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Grade Submission</h2>
            <p className="subheading text-muted-foreground text-sm mt-0.5">
              {target.assignmentTitle} · {target.studentName}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">
              {questions.length > 0 ? "Student Answers" : "Student Answers"}
            </h3>
            {questions.length > 0 ? (
              <div className="space-y-3">
                {questions.map((q, i) => {
                  const points = Number(q.points) || 1;
                  return (
                    <div key={q.id} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Q{i + 1}</span>
                        <span className="text-xs font-medium text-primary">{points} marks</span>
                      </div>
                      <div className="text-sm font-medium">{q.question}</div>
                      <div className="rounded-md bg-muted/40 px-3 py-2 text-sm whitespace-pre-wrap">
                        {answers[q.id] || "No answer"}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <label className="text-xs text-muted-foreground">Mark</label>
                        <input
                          type="number"
                          min={0}
                          max={points}
                          value={marks[q.id] ?? ""}
                          onChange={(e) =>
                            setMarks((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          className="w-20 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="0"
                        />
                        <span className="text-xs text-muted-foreground">/ {points}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-2.5">
                  <span className="text-sm font-medium">
                    Total: {totalMarks} / {maxScore}
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {percent != null ? `${percent}%` : "—"}
                  </span>
                </div>
              </div>
            ) : (
              <>
                {Object.keys(answers).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(answers).map(([qid, answer]) => (
                      <div key={qid} className="rounded-lg border border-border p-3">
                        <div className="text-xs font-medium text-muted-foreground mb-1">{qid}</div>
                        <div className="text-sm whitespace-pre-wrap">{answer || "No answer"}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No answers to display.</p>
                )}
              </>
            )}
          </div>

          {target.aiFeedback && (
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                AI Feedback · Score {target.aiScore ?? "—"}
              </div>
              <div className="text-sm whitespace-pre-wrap">{target.aiFeedback}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {questions.length === 0 && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Teacher Score (0–100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. 85"
                />
              </div>
            )}
            <div className={questions.length > 0 ? "sm:col-span-2" : ""}>
              <label className="block text-sm font-medium mb-1.5">Comment</label>
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Optional feedback for the student"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Grade"}
          </button>
        </div>
      </div>
    </div>
  );
}
