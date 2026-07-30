"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { TagInput } from "@/components/ui/tag-input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SUBJECT_GROUPS: Record<string, string[]> = {
  Languages: ["Arabic", "English", "French", "Hindi", "Urdu"],
  Morals: ["Islamic Studies", "Moral Education"],
  Mathematics: ["Mathematics"],
  Sciences: ["Science", "Physics", "Chemistry", "Biology"],
  Technology: ["Computer Science", "Information Technology", "Design & Technology"],
  Humanities: ["History", "Geography", "Social Studies", "UAE Social Studies", "Economics"],
  Business: ["Business Studies", "Accounting"],
  Arts: ["Art", "Music"],
  "Physical Education": ["Physical Education"],
};

const GRADES = [
  { value: "KG1", label: "KG1" },
  { value: "KG2", label: "KG2" },
  { value: "Grade 1", label: "Grade 1 / Year 2" },
  { value: "Grade 2", label: "Grade 2 / Year 3" },
  { value: "Grade 3", label: "Grade 3 / Year 4" },
  { value: "Grade 4", label: "Grade 4 / Year 5" },
  { value: "Grade 5", label: "Grade 5 / Year 6" },
  { value: "Grade 6", label: "Grade 6 / Year 7" },
  { value: "Grade 7", label: "Grade 7 / Year 8" },
  { value: "Grade 8", label: "Grade 8 / Year 9" },
  { value: "Grade 9", label: "Grade 9 / Year 10" },
  { value: "Grade 10", label: "Grade 10 / Year 11" },
  { value: "Grade 11", label: "Grade 11 / Year 12" },
  { value: "Grade 12", label: "Grade 12 / Year 13" },
];

const CURRICULA = [
  "MOE (Ministry of Education)",
  "ADEK (Abu Dhabi)",
  "KHDA (Dubai)",
  "American",
  "British / IGCSE",
  "International Baccalaureate (IB)",
  "Indian (CBSE/ICSE)",
  "Pakistani",
  "SABIS",
  "Other",
];

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function AddSubjectModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [curriculum, setCurriculum] = useState("");
  const [scope, setScope] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name || !grade) {
      setError("Subject name and grade are required");
      return;
    }

    setLoading(true);

    try {
      const subjectResult = await api("/api/subjects", {
        method: "POST",
        body: {
          name,
          grade,
          scope: [curriculum, scope].filter(Boolean).join(" · ") || undefined,
        },
      });

      if (!subjectResult.success) {
        setError((subjectResult.data as any)?.error || "Failed to create subject");
        setLoading(false);
        return;
      }

      const subjectId = (subjectResult.data as any).data.id;

      for (const topic of topics) {
        await api(`/api/subjects/${subjectId}/topics`, {
          method: "POST",
          body: { name: topic },
        });
      }

      setLoading(false);
      reset();
      onCreated();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  function reset() {
    setName("");
    setGrade("");
    setCurriculum("");
    setScope("");
    setTopics([]);
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add Subject</h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground text-lg">&times;</button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Subject *</label>
            <Select value={name || null} onValueChange={(v) => setName(v ?? "")}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select subject..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUBJECT_GROUPS).map(([group, subjects]) => (
                  <SelectGroup key={group}>
                    <SelectLabel>{group}</SelectLabel>
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Grade *</label>
              <Select value={grade || null} onValueChange={(v) => setGrade(v ?? "")}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select grade..." />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Curriculum</label>
              <Select value={curriculum || null} onValueChange={(v) => setCurriculum(v ?? "")}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select curriculum..." />
                </SelectTrigger>
                <SelectContent>
                  {CURRICULA.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Scope</label>
            <input
              type="text"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="e.g. Algebra, World War II, Cells"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Topics</label>
            <TagInput tags={topics} onTagsChange={setTopics} placeholder="Type a topic and press Enter" />
            <p className="mt-1 text-xs text-muted-foreground">Press Enter to add each topic</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating..." : "Add Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
