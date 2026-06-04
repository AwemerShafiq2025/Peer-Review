"use client";

import type { EditorVerdict, PublicReviewer, ReviewResult } from "@/lib/types";
import { IconDownload } from "./icons";

export type ExportReview = {
  reviewerId: string;
  review: ReviewResult;
};

export type ExportReport = {
  paperTitle: string;
  date: string | Date;
  quartile?: string;
  verdict: EditorVerdict;
  panel: PublicReviewer[];
  reviews: ExportReview[];
};

function list(items: string[]) {
  if (!items.length) return <p>None noted.</p>;

  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function ExportButton({ report }: { report: ExportReport }) {
  const reviewById = new Map(report.reviews.map((item) => [item.reviewerId, item.review]));

  return (
    <>
      <button type="button" onClick={() => window.print()} className="btn-outline !px-5 !py-2 text-sm">
        <IconDownload width={17} height={17} />
        Download Report (PDF)
      </button>

      <div className="print-report">
        <h1>Peer Review Report - {report.paperTitle}</h1>
        <div className="print-meta">
          <span>Date: {formatDate(report.date)}</span>
          <span>Quartile: {report.quartile ?? "N/A"}</span>
          <span>Final Verdict: {report.verdict.decision}</span>
        </div>

        <section>
          <h2>Editor's Meta Review</h2>
          <p>{report.verdict.metaReview}</p>
          <h3>Priority Actions</h3>
          {list(report.verdict.priorityActions)}
        </section>

        {report.panel.map((reviewer) => {
          const review = reviewById.get(reviewer.id);
          if (!review) return null;

          return (
            <section key={reviewer.id} className="print-reviewer">
              <h2>{reviewer.name}</h2>
              <p>
                <strong>{reviewer.role}</strong>
              </p>
              <p>
                Recommendation: <strong>{review.recommendation}</strong> | Score:{" "}
                <strong>{review.score}/10</strong> | Confidence:{" "}
                <strong>{review.confidence}/5</strong>
              </p>
              <h3>Summary</h3>
              <p>{review.summary}</p>
              <h3>Strengths</h3>
              {list(review.strengths)}
              <h3>Weaknesses</h3>
              {list(review.weaknesses)}
              <h3>Comments</h3>
              {review.comments.length ? (
                <ol>
                  {review.comments.map((comment, index) => (
                    <li key={index}>
                      <strong>
                        {comment.section} ({comment.severity})
                      </strong>
                      : {comment.comment}
                    </li>
                  ))}
                </ol>
              ) : (
                <p>None noted.</p>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
