"use client";

import { useEffect, useState } from "react";

export default function StatsSection() {
  const [reviewCount, setReviewCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setReviewCount(data.total ?? 0))
      .catch(() => setReviewCount(0));
  }, []);

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k+`;
    return n.toString();
  };

  const stats = [
    {
      value: reviewCount === null ? "..." : `${formatCount(reviewCount)}+`,
      label: "Papers Reviewed",
      sublabel: "Real reviews from our platform",
    },
    {
      value: "Q1–Q4",
      label: "Journal Calibration",
      sublabel: "Same paper, different bar",
    },
    {
      value: "~60s",
      label: "Average Review Time",
      sublabel: "Full panel + editorial decision",
    },
    {
      value: "100%",
      label: "Private by Default",
      sublabel: "PDF never leaves your browser",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="rounded-xl border border-subtle bg-elevated/60 px-6 py-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`flex flex-col gap-1 ${
                i !== 0
                  ? "border-t border-subtle pt-6 md:border-l md:border-t-0 md:pl-6 md:pt-0"
                  : ""
              }`}
            >
              <span
                className={`font-mono text-3xl font-bold text-accent transition-all duration-500 ${
                  i === 0 && reviewCount === null ? "animate-pulse opacity-50" : ""
                }`}
              >
                {stat.value}
              </span>
              <span className="text-sm font-semibold text-text-primary">
                {stat.label}
              </span>
              <span className="text-xs leading-relaxed text-text-tertiary">
                {stat.sublabel}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}