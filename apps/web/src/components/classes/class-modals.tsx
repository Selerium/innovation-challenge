"use client";

import { useState } from "react";
import { api } from "@/lib/api";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
};

function ModalShell({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function JoinClassModal({ open, onClose, onDone }: ModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!code.trim()) {
      setError("Enter an invite code");
      return;
    }
    setLoading(true);

    const result = await api("/api/classes/join", {
      method: "POST",
      body: { inviteCode: code.trim() },
    });

    if (!result.success) {
      setError((result.data as any)?.error || "Failed to join class");
      setLoading(false);
      return;
    }

    setLoading(false);
    setCode("");
    onDone();
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Join a Class">
      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Invite Code *</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. ABC123"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Ask your teacher for the class invite code
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Joining..." : "Join Class"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function CreateClassModal({ open, onClose, onDone }: ModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<any>(null);

  function reset() {
    setName("");
    setError("");
    setCreated(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Class name is required");
      return;
    }
    setLoading(true);

    const result = await api("/api/classes", {
      method: "POST",
      body: { name: name.trim() },
    });

    if (!result.success) {
      setError((result.data as any)?.error || "Failed to create class");
      setLoading(false);
      return;
    }

    setLoading(false);
    setCreated((result.data as any).data);
  }

  async function handleCopy() {
    if (created?.inviteCode) {
      await navigator.clipboard.writeText(created.inviteCode);
    }
  }

  return (
    <ModalShell open={open} onClose={handleClose} title={created ? "Class Created" : "Create a Class"}>
      {created ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share this invite code with your students to let them join <strong>{created.name}</strong>.
          </p>
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-4 py-3">
            <span className="text-2xl font-bold tracking-[0.3em] text-primary">
              {created.inviteCode}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              Copy
            </button>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Class Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Grade 7 Mathematics"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
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
                {loading ? "Creating..." : "Create Class"}
              </button>
            </div>
          </form>
        </>
      )}
    </ModalShell>
  );
}
