"use client";

import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { EditorVerdict, PublicReviewer, ReviewResult } from "@/lib/types";
import { IconDownload, Spinner } from "./icons";

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

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function list(title: string, items?: string[]) {
  if (!items?.length) return "";

  return `
    <h3>${escapeHtml(title)}</h3>
    <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  `;
}

function buildPDFContent(report: ExportReport) {
  const reviewById = new Map(report.reviews.map((item) => [item.reviewerId, item.review]));
  const reviewerSections = report.panel
    .map((reviewer) => {
      const review = reviewById.get(reviewer.id);
      if (!review) return "";

      const comments = review.comments?.length
        ? `
          <h3>Comments</h3>
          <ol>
            ${review.comments
              .map(
                (comment) => `
                  <li>
                    <strong>${escapeHtml(comment.section)} (${escapeHtml(comment.severity)})</strong>:
                    ${escapeHtml(comment.comment)}
                  </li>
                `
              )
              .join("")}
          </ol>
        `
        : "";

      const questions = list("Questions for Authors", review.questionsForAuthors);

      return `
        <section class="reviewer">
          <h2>${escapeHtml(reviewer.name || "Reviewer")}</h2>
          <p class="muted"><strong>${escapeHtml(reviewer.role || "Peer Review")}</strong></p>
          <p>
            Recommendation: <strong>${escapeHtml(review.recommendation)}</strong>
            &nbsp;|&nbsp; Score: <strong>${escapeHtml(review.score)}/10</strong>
            &nbsp;|&nbsp; Confidence: <strong>${escapeHtml(review.confidence)}/5</strong>
          </p>
          ${review.summary ? `<h3>Summary</h3><p>${escapeHtml(review.summary)}</p>` : ""}
          ${list("Strengths", review.strengths)}
          ${list("Weaknesses", review.weaknesses)}
          ${comments}
          ${questions}
        </section>
      `;
    })
    .filter(Boolean)
    .join("");

  return `
    <style>
      * { box-sizing: border-box; }
      h1 { margin: 0 0 14px; font-size: 26px; line-height: 1.2; }
      h2 { margin: 24px 0 8px; font-size: 18px; }
      h3 { margin: 16px 0 6px; font-size: 13px; }
      p { margin: 0 0 10px; }
      ul, ol { margin: 0 0 12px 20px; padding: 0; }
      li { margin: 0 0 6px; }
      .meta {
        display: grid;
        gap: 4px;
        margin-bottom: 18px;
        padding-bottom: 12px;
        border-bottom: 1px solid #d6d6d6;
      }
      .muted { color: #333333; }
      .reviewer {
        padding-top: 4px;
        border-top: 1px solid #e5e5e5;
      }
    </style>
    <h1>Peer Review Report - ${escapeHtml(report.paperTitle)}</h1>
    <div class="meta">
      <span>Date: ${escapeHtml(formatDate(report.date))}</span>
      <span>Quartile: ${escapeHtml(report.quartile ?? "N/A")}</span>
      <span>Final Verdict: ${escapeHtml(report.verdict.decision)}</span>
    </div>
    <section>
      <h2>Editor's Meta Review</h2>
      ${report.verdict.metaReview ? `<p>${escapeHtml(report.verdict.metaReview)}</p>` : ""}
      ${report.verdict.decisionRationale ? `<h3>Decision Rationale</h3><p>${escapeHtml(report.verdict.decisionRationale)}</p>` : ""}
      ${report.verdict.quartileAssessment ? `<h3>Quartile Assessment</h3><p>${escapeHtml(report.verdict.quartileAssessment)}</p>` : ""}
      ${list("Priority Actions", report.verdict.priorityActions)}
    </section>
    ${reviewerSections}
  `;
}

export default function ExportButton({ report }: { report: ExportReport }) {
  const [loading, setLoading] = useState(false);

  async function downloadPDF() {
    setLoading(true);

    const element = document.createElement("div");
    element.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: 794px;
      background: white;
      color: black;
      font-family: Arial, sans-serif;
      padding: 40px;
      font-size: 12px;
      line-height: 1.6;
    `;
    element.innerHTML = buildPDFContent(report);
    document.body.appendChild(element);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 794,
        windowWidth: 794,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4",
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = pdfWidth / canvas.width;
      const scaledHeight = canvas.height * ratio;
      let heightLeft = scaledHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - scaledHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`peer-review-${Date.now()}.pdf`);
    } finally {
      document.body.removeChild(element);
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={downloadPDF} disabled={loading} className="btn-outline !px-5 !py-2 text-sm">
      {loading ? <Spinner width={17} height={17} /> : <IconDownload width={17} height={17} />}
      {loading ? "Generating PDF..." : "Download PDF"}
    </button>
  );
}
