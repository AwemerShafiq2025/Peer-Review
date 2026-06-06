"use client";

import { useState } from "react";
import Link from "next/link";
import { IconGavel, IconUser, IconDoc } from "@/components/icons";

const SAMPLE_VERDICT = {
  decision: "Minor Revision",
  metaReview:
    "The manuscript presents a solid contribution to transformer-based model compression. Reviewer 1 provided a thorough methodological assessment and found the approach sound. The panel recommends minor revisions to address clarity in the experimental setup and broaden the baseline comparisons before acceptance.",
  priorityActions: [
    "Provide additional baseline comparisons with unstructured pruning methods.",
    "Clarify the recovery fine-tuning procedure and its computational cost.",
    "Address the generalizability of results beyond the tested model size.",
  ],
};

const SAMPLE_REVIEWERS = [
  {
    name: "Reviewer 1",
    role: "Methodology & Rigor",
    recommendation: "Minor Revision",
    score: 7,
    confidence: 4,
    color: "#4D9BFF",
    summary:
      "The proposed EfficientPrune method is well-motivated and the structured pruning approach is clearly described. The evaluation benchmarks are appropriate and results are convincing for the tested configuration.",
    strengths: [
      "Clear presentation of the pruning algorithm",
      "Reproducible experimental setup with standard benchmarks",
    ],
    weaknesses: [
      "Limited comparison with unstructured sparsity baselines",
      "Recovery fine-tuning cost not reported",
    ],
  },
  {
    name: "Reviewer 2",
    role: "Novelty & Significance",
    recommendation: "Major Revision",
    score: 5,
    confidence: 2,
    color: "#00D4FF",
    summary: "Fallback assessment — reviewer could not complete within the time window.",
    strengths: ["Clear technical direction"],
    weaknesses: ["Novelty assessment incomplete"],
  },
];

const REC_COLOR: Record<string, string> = {
  "Minor Revision": "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  "Major Revision": "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Accept: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Reject: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

export default function SampleReviewDemo() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="chip mb-3 inline-flex">
            <IconDoc width={13} height={13} className="text-accent" />
            Sample Review — Read Only
          </span>
          <h2 className="text-2xl font-bold">See what a review looks like</h2>
          <p className="mt-1.5 text-text-secondary">
            This is a real review output for a sample ML paper.{" "}
            <Link href="/register" className="text-accent underline-offset-2 hover:underline">
              Sign up free
            </Link>{" "}
            to review your own paper.
          </p>
        </div>
        <Link href="/register" className="btn-primary shrink-0 !px-5 !py-2.5 text-sm">
          Try with your paper →
        </Link>
      </div>

      {/* Decision Banner */}
      <div className="card mb-4 overflow-hidden p-0 ring-1 ring-sky-400/30">
        <div className="border-b border-subtle p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-white/5 text-sky-300 ring-1 ring-sky-400/30">
                <IconGavel width={18} height={18} />
              </span>
              <div>
                <p className="text-xs uppercase tracking-widest text-text-tertiary">
                  Editorial Decision · Q2 venue
                </p>
                <h3 className="text-xl font-bold text-sky-300">Minor Revision</h3>
              </div>
            </div>
            <span className="chip text-xs">EfficientPrune · Sample Paper</span>
          </div>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-sm leading-relaxed text-text-secondary">
            {SAMPLE_VERDICT.metaReview}
          </p>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              Priority Actions
            </h4>
            <ol className="space-y-2">
              {SAMPLE_VERDICT.priorityActions.map((action, i) => (
                <li key={i} className="flex gap-3 text-sm text-text-secondary">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-pill bg-accent/15 text-xs font-bold text-accent">
                    {i + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Reviewer Cards Preview */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mb-4 w-full rounded-md border border-subtle bg-elevated/40 px-4 py-3 text-left text-sm text-text-secondary transition-colors hover:border-white/20 hover:text-text-primary"
      >
        <span className="flex items-center justify-between">
          <span>
            {expanded ? "Hide" : "Show"} individual reviewer feedback
          </span>
          <span className="text-text-tertiary">{expanded ? "▲" : "▼"}</span>
        </span>
      </button>

      {expanded && (
        <div className="grid gap-4 md:grid-cols-2">
          {SAMPLE_REVIEWERS.map((reviewer, i) => (
            <div
              key={i}
              className="card overflow-hidden p-0"
              style={{ borderColor: `${reviewer.color}33` }}
            >
              <div className="flex items-start gap-3 border-b border-subtle p-4">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-md ring-1"
                  style={{
                    background: `${reviewer.color}22`,
                    color: reviewer.color,
                    borderColor: `${reviewer.color}55`,
                  }}
                >
                  <IconUser width={18} height={18} />
                </span>
                <div className="flex-1">
                  <h4 className="font-semibold">{reviewer.name}</h4>
                  <p className="text-xs text-text-secondary">{reviewer.role}</p>
                </div>
                <span
                  className={`rounded-pill px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                    REC_COLOR[reviewer.recommendation]
                  }`}
                >
                  {reviewer.recommendation}
                </span>
              </div>
              <div className="space-y-3 p-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Score", value: `${reviewer.score}/10`, max: 10, val: reviewer.score },
                    { label: "Confidence", value: `${reviewer.confidence}/5`, max: 5, val: reviewer.confidence },
                  ].map((metric) => (
                    <div key={metric.label}>
                      <div className="mb-1 flex justify-between text-xs text-text-tertiary">
                        <span>{metric.label}</span>
                        <span className="font-mono text-text-secondary">{metric.value}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-pill bg-white/10">
                        <div
                          className="h-full rounded-pill transition-all"
                          style={{
                            width: `${(metric.val / metric.max) * 100}%`,
                            background: reviewer.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs leading-relaxed text-text-secondary">
                  {reviewer.summary}
                </p>
                {reviewer.strengths.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-emerald-300">STRENGTHS</p>
                    {reviewer.strengths.map((s, j) => (
                      <p key={j} className="text-xs text-text-secondary">+ {s}</p>
                    ))}
                  </div>
                )}
                {reviewer.weaknesses.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-amber-300">WEAKNESSES</p>
                    {reviewer.weaknesses.map((w, j) => (
                      <p key={j} className="text-xs text-text-secondary">− {w}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-6 rounded-xl border border-accent/20 bg-accent/5 p-6 text-center">
        <h3 className="font-semibold">Ready to review your own paper?</h3>
        <p className="mt-1.5 text-sm text-text-secondary">
          Free to use. No credit card required. Results in ~60 seconds.
        </p>
        <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/register" className="btn-primary !px-6 !py-2.5 text-sm">
            Create Free Account
          </Link>
          <Link href="/login" className="btn-outline !px-6 !py-2.5 text-sm">
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}