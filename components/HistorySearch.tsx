"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function HistorySearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [verdict, setVerdict] = useState(searchParams.get("verdict") ?? "");

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (verdict) params.set("verdict", verdict);
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, verdict, pathname, router]);

  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by paper title..."
        className="flex-1 rounded-md border border-subtle bg-elevated px-4 py-2.5 text-base text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-accent/60"
      />
      <select
        value={verdict}
        onChange={(e) => setVerdict(e.target.value)}
        className="rounded-md border border-subtle bg-elevated px-4 py-2.5 text-base text-text-primary outline-none transition-colors focus:border-accent/60"
      >
        <option value="">All Verdicts</option>
        <option value="Accepted">Accepted</option>
        <option value="Minor Revision">Minor Revision</option>
        <option value="Major Revision">Major Revision</option>
        <option value="Rejected">Rejected</option>
      </select>
    </div>
  );
}