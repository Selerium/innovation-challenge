"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  subject: { name: string; grade: string };
  submission?: { status: string } | null;
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await api<{ data: Assignment[] }>("/api/assignments");
    if (result.success) setAssignments(result.data!.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = assignments.reduce<Record<string, Assignment[]>>((acc, a) => {
    const key = a.subject?.name || "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="subheading text-muted-foreground mt-1">View and complete your assignments</p>
        </div>

        {assignments.length === 0 ? (
          <div className="rounded-xl border border-border bg-secondary p-12 text-center">
            <p className="text-muted-foreground">No assignments yet</p>
            <p className="text-sm text-muted-foreground mt-2">Generate an assignment from any topic in your subjects.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([subjectName, items]) => (
              <div key={subjectName}>
                <h2 className="text-lg font-semibold mb-3">{subjectName} ({items[0]?.subject?.grade})</h2>
                <div className="space-y-2">
                  {items.map((a) => {
                    const date = new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    return (
                      <Link
                        key={a.id}
                        href={`/assignments/${a.id}`}
                        className="flex items-center justify-between rounded-xl border border-border bg-secondary px-5 py-4 hover:bg-muted transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{a.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{date}</div>
                        </div>
                        <div className="shrink-0 ml-4">
                          {a.submission ? (
                            <span className="rounded-md bg-success/20 px-2.5 py-1 text-xs font-medium text-success">
                              Completed
                            </span>
                          ) : (
                            <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                              Pending
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
