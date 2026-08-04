"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

type Props = {
  classId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

type Question = { question: string; answer: string; points: number };

export function NewAssignmentModal({ classId, open, onClose, onCreated }: Props) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [topicName, setTopicName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [questions, setQuestions] = useState<Question[]>([{ question: "", answer: "", points: 10 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setTopicName("");
    setDueDate("");
    setQuestions([{ question: "", answer: "", points: 10 }]);
    setSaving(false);
    api("/api/subjects").then((r) => {
      if (r.success) {
        setSubjects(r.data.data);
        setSubjectName(r.data.data[0]?.name ?? "");
      }
    });
  }, [open]);

  if (!open) return null;

  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  function updateQuestion(i: number, patch: Partial<Question>) {
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  async function handleCreate() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (questions.some((q) => !q.question.trim())) {
      toast.error("Every question needs a prompt");
      return;
    }
    if (questions.some((q) => !Number.isFinite(Number(q.points)) || Number(q.points) < 1)) {
      toast.error("Every question needs a marks value of at least 1");
      return;
    }
    setSaving(true);
    const result = await api(`/api/classes/${classId}/assignments`, {
      method: "POST",
      body: {
        title,
        description,
        subjectName,
        topicName,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        questions: questions.map((q, i) => ({
          id: `q${i + 1}`,
          question: q.question,
          answer: q.answer,
          points: Math.floor(Number(q.points)),
        })),
      },
    });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error || "Failed to create assignment");
      return;
    }
    toast.success("Assignment created");
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">New Assignment</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. Algebra Basics - Unit Quiz"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Instructions for your students (optional)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Subject</label>
              <select
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {subjects.length === 0 && <option value="">No subjects yet</option>}
                {subjects.map((s: any) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.grade})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Topic</label>
              <input
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium">
                Questions{" "}
                <span className="ml-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Total: {totalMarks} marks
                </span>
              </label>
              <button
                onClick={() => setQuestions((prev) => [...prev, { question: "", answer: "", points: 10 }])}
                className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
              >
                + Add question
              </button>
            </div>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Question {i + 1}</span>
                    {questions.length > 1 && (
                      <button
                        onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-xs text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    value={q.question}
                    onChange={(e) => updateQuestion(i, { question: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Question prompt"
                  />
                  <input
                    value={q.answer}
                    onChange={(e) => updateQuestion(i, { answer: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Model answer (optional)"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Marks</label>
                    <input
                      type="number"
                      min={1}
                      value={q.points}
                      onChange={(e) => updateQuestion(i, { points: Number(e.target.value) })}
                      className="w-24 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-xs text-muted-foreground">points for this question</span>
                  </div>
                </div>
              ))}
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
            onClick={handleCreate}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Creating..." : "Post to Class"}
          </button>
        </div>
      </div>
    </div>
  );
}
