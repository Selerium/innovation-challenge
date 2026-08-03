"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageLoading, ErrorState } from "@/components/ui/loading";

export default function ClassDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const result = await api(`/api/classes/${params.id}`);
      if (cancelled) return;
      if (result.success) {
        setData(result.data.data);
      } else {
        setError(result.error || "Failed to load this class.");
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [params.id]);

  if (loading) {
    return <PageLoading />;
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <ErrorState
            message={error || "This class could not be found."}
            onRetry={() => {
              setData(null);
              setLoading(true);
              setError(null);
              api(`/api/classes/${params.id}`).then((r) => {
                if (r.success) setData(r.data.data);
                else setError(r.error || "Failed to load this class.");
                setLoading(false);
              });
            }}
          />
          <div className="mt-4 text-center">
            <Link href="/classes" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              &larr; All classes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function handleCopy() {
    if (data.inviteCode) {
      await navigator.clipboard.writeText(data.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  async function handleLeave() {
    setActing(true);
    await api(`/api/classes/${data.id}/leave`, { method: "POST" });
    router.push("/classes");
  }

  async function handleDelete() {
    if (!confirm(`Delete "${data.name}" and remove all members?`)) return;
    setActing(true);
    await api(`/api/classes/${data.id}`, { method: "DELETE" });
    router.push("/classes");
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/classes" className="text-sm text-muted-foreground hover:text-primary transition-colors">
          &larr; All classes
        </Link>

        <div className="flex items-start justify-between mt-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">{data.name}</h1>
            <p className="subheading text-muted-foreground mt-1">
              Taught by {data.teacherName} · {data.members.length} member{data.members.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!data.isTeacher && (
              <button
                onClick={handleLeave}
                disabled={acting}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 transition-colors"
              >
                {acting ? "Leaving..." : "Leave Class"}
              </button>
            )}
            {data.isTeacher && (
              <button
                onClick={handleDelete}
                disabled={acting}
                className="rounded-lg border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
              >
                {acting ? "Deleting..." : "Delete Class"}
              </button>
            )}
          </div>
        </div>

        {data.isTeacher && (
          <div className="mb-6 rounded-xl border border-border bg-secondary p-5">
            <div className="text-xs font-medium text-muted-foreground mb-2">Invite Code</div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold tracking-[0.3em] text-primary">
                {data.inviteCode}
              </span>
              <button
                onClick={handleCopy}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Share this code so students can join from their dashboard.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-border bg-secondary">
          <div className="border-b border-border px-5 py-3">
            <h3 className="font-semibold">Members</h3>
          </div>
          {data.members.length > 0 ? (
            <ul className="divide-y divide-border">
              {data.members.map((m: any) => (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                    {m.displayName?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{m.displayName}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{m.role}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No members yet — share the invite code to bring students in.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
