"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useProfile } from "@/lib/profile-context";
import { JoinClassModal, CreateClassModal } from "@/components/classes/class-modals";

export default function ClassesPage() {
  const { user } = useProfile();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [joinOpen, setJoinOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    api<{ data: any[] }>("/api/classes").then((r) => {
      if (r.success) setClasses(r.data!.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const isTeacher = user?.role === "TEACHER";

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Classes</h1>
            <p className="subheading text-muted-foreground mt-1">
              {isTeacher ? "Create classes and invite your students" : "Join classes with an invite code"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isTeacher && (
              <button
                onClick={() => setCreateOpen(true)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                + Create Class
              </button>
            )}
            <button
              onClick={() => setJoinOpen(true)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
            >
              + Add Class
            </button>
          </div>
        </div>

        {classes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((c) => (
              <Link
                key={c.id}
                href={`/classes/${c.id}`}
                className="rounded-xl border border-border bg-secondary p-5 hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{c.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.userRole === "TEACHER" ? "You teach this class" : `Taught by ${c.teacherName}`}
                    </p>
                  </div>
                  <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    Open &rarr;
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c.memberCount} member{c.memberCount === 1 ? "" : "s"}</span>
                  <span className="font-mono tracking-widest">{c.inviteCode}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-secondary p-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {isTeacher
                ? "You haven't created any classes yet. Create one to get an invite code."
                : "You haven't joined any classes yet. Ask your teacher for an invite code."}
            </p>
            <button
              onClick={() => (isTeacher ? setCreateOpen(true) : setJoinOpen(true))}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isTeacher ? "Create Your First Class" : "Join a Class"}
            </button>
          </div>
        )}
      </div>

      <JoinClassModal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        onDone={() => {
          setJoinOpen(false);
          api<{ data: any[] }>("/api/classes").then((r) => {
            if (r.success) setClasses(r.data!.data);
          });
        }}
      />

      <CreateClassModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onDone={() => {
          setCreateOpen(false);
          api<{ data: any[] }>("/api/classes").then((r) => {
            if (r.success) setClasses(r.data!.data);
          });
        }}
      />
    </div>
  );
}
