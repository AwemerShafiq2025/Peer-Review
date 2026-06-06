"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EditTitleButton({
  reviewId,
  currentTitle,
}: {
  reviewId: string;
  currentTitle: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(currentTitle);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === currentTitle) {
      setEditing(false);
      setTitle(currentTitle);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to update title");
      router.refresh();
      setEditing(false);
    } catch {
      setTitle(currentTitle);
      setEditing(false);
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setTitle(currentTitle);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          className="rounded-md border border-accent/50 bg-[#13131A] px-3 py-1.5 text-sm text-white placeholder-text-secondary outline-none focus:border-accent focus:ring-1 focus:ring-accent/40 disabled:opacity-50"
          style={{ minWidth: 200 }}
        />
        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/80 disabled:opacity-50"
        >
          {loading ? "…" : "Save"}
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="rounded-md border border-subtle px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-white disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Edit title"
      className="ml-2 inline-flex items-center rounded p-1 text-text-secondary opacity-0 transition hover:text-accent group-hover:opacity-100"
      aria-label="Edit paper title"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  );
}