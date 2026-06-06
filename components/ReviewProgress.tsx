"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/icons";

const STEPS = [
  { id: "reading", label: "Reading your manuscript..." },
  { id: "analyzing", label: "Analyzing methodology and claims..." },
  { id: "reviewing", label: "Reviewers writing feedback..." },
  { id: "deliberating", label: "Editor deliberating on verdict..." },
  { id: "saving", label: "Saving review to history..." },
];

export default function ReviewProgress({
  completedReviewers,
  totalReviewers,
  editorStatus,
  statusMsg,
  visible,
}: {
  completedReviewers: number;
  totalReviewers: number;
  editorStatus: "idle" | "working" | "done";
  statusMsg: string;
  visible: boolean;
}) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  const currentStep =
    editorStatus === "working"
      ? 3
      : completedReviewers === 0
      ? 0
      : completedReviewers < totalReviewers
      ? 2
      : completedReviewers === totalReviewers && editorStatus === "idle"
      ? 2
      : editorStatus === "done" 
      ? 4 
      : 0;

  const progressPercentage = (completedReviewers / totalReviewers) * 100;

  return (
    <div className="card mt-6 p-6 sm:p-8 relative overflow-hidden backdrop-blur-sm">
      <div className="absolute inset-0 bg-accent/5" />
      <div className="relative">
        <h2 className="mb-4 text-xl font-bold flex items-center gap-3">
          <Spinner className="text-accent" /> Review in Progress
        </h2>

        {/* Animated progress bar */}
        <div className="relative mt-8 min-h-[3rem] w-full max-w-sm rounded-[1.5rem] bg-accent/15 p-1 shadow-inner">
          <div
            className="absolute bottom-1 left-1 top-1 rounded-[1.25rem] bg-accent opacity-20 transition-all duration-[2000ms] ease-out"
            style={{ width: `calc(${Math.max(10, progressPercentage)}% - 8px)` }}
          />

          <div className="absolute inset-0 flex items-center justify-between px-5 font-mono text-sm font-semibold tracking-wide">
            <span className="text-accent drop-shadow-md">
              {editorStatus === "working"
                ? `Editor deliberating${dots}`
                : completedReviewers >= totalReviewers
                ? `All ${totalReviewers} reviewers done`
                : `${completedReviewers} of ${totalReviewers} reviewers done${dots}`}
            </span>
            <span className="text-accent opacity-60">
              {completedReviewers}/{totalReviewers}
            </span>
          </div>
        </div>

        {/* Step indicators */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-6">
          {[
            { label: "Reading", done: completedReviewers > 0 || editorStatus === "working" || editorStatus === "done" },
            { label: "Reviewer 1", done: completedReviewers >= 1 },
            { label: "Reviewers 2-4", done: completedReviewers >= 4 },
            { label: "Editor", done: editorStatus === "working" || editorStatus === "done" },
          ].map((step, i) => (
            <div key={i} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  step.done
                    ? "bg-accent text-white"
                    : "bg-base/60 border border-subtle text-text-tertiary"
                }`}
              >
                {step.done ? "✓" : i + 1}
              </div>
              <span
                className={`text-sm ${
                  step.done ? "text-text-primary font-medium" : "text-text-tertiary"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Current status message */}
        {statusMsg && (
          <p className="mt-6 text-sm italic text-text-secondary text-center">
            {statusMsg}
          </p>
        )}
      </div>
    </div>
  );
}