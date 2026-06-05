"use client";

import { useState } from "react";
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

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getVerdictColor(decision: string): [number, number, number] {
  if (decision === "Accepted") return [34, 197, 94];
  if (decision === "Minor Revision") return [56, 189, 248];
  if (decision === "Major Revision") return [251, 191, 36];
  return [244, 63, 94];
}

function getRecColor(rec: string): [number, number, number] {
  if (rec === "Accept") return [34, 197, 94];
  if (rec === "Minor Revision") return [56, 189, 248];
  if (rec === "Major Revision") return [251, 191, 36];
  return [244, 63, 94];
}

function buildPDF(report: ExportReport) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 18;
  const contentW = pageW - margin * 2 - 6; // extra 6mm safe buffer so long lines never clip
  let y = 0;

  function checkNewPage(needed: number) {
    if (y + needed > pageH - 16) {
      pdf.addPage();
      y = 20;
    }
  }

  function drawLine(color: [number, number, number] = [220, 220, 230]) {
    pdf.setDrawColor(...color);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, pageW - margin, y);
    y += 4;
  }

  function addText(
    text: string,
    x: number,
    maxW: number,
    size: number,
    style: "normal" | "bold" | "italic",
    color: [number, number, number],
    lineH: number
  ) {
    pdf.setFont("helvetica", style);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(text, maxW);
    lines.forEach((line: string) => {
      checkNewPage(lineH);
      pdf.text(line, x, y);
      y += lineH;
    });
  }

  // ── HEADER BAR ──────────────────────────────────────────────
  pdf.setFillColor(10, 10, 20);
  pdf.rect(0, 0, pageW, 30, "F");

  // Accent line
  pdf.setFillColor(77, 155, 255);
  pdf.rect(0, 30, pageW, 1.2, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.setTextColor(255, 255, 255);
  pdf.text("PeerReviewer", margin, 13);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(160, 160, 180);
  pdf.text("AI-Powered Peer Review Panel  ·  Albatross Technologies", margin, 20);

  // Date top right
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 140);
  pdf.text(formatDate(report.date), pageW - margin, 20, { align: "right" });

  y = 40;

  // ── PAPER TITLE ─────────────────────────────────────────────
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.setTextColor(15, 15, 30);
  const titleLines = pdf.splitTextToSize(report.paperTitle, contentW);
  titleLines.forEach((line: string) => {
    pdf.text(line, margin, y);
    y += 7;
  });
  y += 3;

  // ── META CHIPS ───────────────────────────────────────────────
  // Quartile chip
  pdf.setFillColor(77, 155, 255);
  pdf.roundedRect(margin, y, 18, 7, 1.5, 1.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text(report.quartile ?? "—", margin + 9, y + 4.8, { align: "center" });

  // Verdict chip
  const vColor = getVerdictColor(report.verdict.decision);
  pdf.setFillColor(...vColor);
  pdf.roundedRect(margin + 22, y, 38, 7, 1.5, 1.5, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.text(report.verdict.decision, margin + 41, y + 4.8, { align: "center" });

  // Score chip
  pdf.setFillColor(35, 35, 55);
  pdf.roundedRect(margin + 64, y, 28, 7, 1.5, 1.5, "F");
  pdf.setTextColor(180, 180, 200);
  const avgScore =
    report.reviews.length > 0
      ? (
          report.reviews.reduce((a, r) => a + (r.review?.score ?? 0), 0) /
          report.reviews.length
        ).toFixed(1)
      : "—";
  pdf.text(`Avg ${avgScore}/10`, margin + 78, y + 4.8, { align: "center" });

  y += 14;
  drawLine([200, 210, 230]);

  // ── EDITORIAL DECISION ───────────────────────────────────────
  pdf.setFillColor(245, 248, 255);
  pdf.rect(margin, y, contentW, 7, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(77, 155, 255);
  pdf.text("EDITORIAL DECISION", margin + 3, y + 5);
  y += 11;

  if (report.verdict.metaReview) {
    addText(report.verdict.metaReview, margin, contentW, 9, "normal", [40, 40, 65], 5.5);
    y += 3;
  }

  // 2-column: rationale + quartile assessment
  const colW = contentW / 2 - 3;
  if (report.verdict.decisionRationale || report.verdict.quartileAssessment) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(110, 110, 135);
    pdf.text("WHY THIS DECISION", margin, y);
    pdf.text(`AGAINST THE ${report.quartile ?? ""} BAR`, margin + colW + 6, y);
    y += 5;

    const leftLines = pdf.splitTextToSize(report.verdict.decisionRationale ?? "", colW);
    const rightLines = pdf.splitTextToSize(report.verdict.quartileAssessment ?? "", colW);
    const maxL = Math.max(leftLines.length, rightLines.length);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(45, 45, 70);
    for (let i = 0; i < maxL; i++) {
      checkNewPage(5.5);
      if (leftLines[i]) pdf.text(leftLines[i], margin, y);
      if (rightLines[i]) pdf.text(rightLines[i], margin + colW + 6, y);
      y += 5.5;
    }
    y += 4;
  }

  // Priority Actions
  if (report.verdict.priorityActions?.length) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(110, 110, 135);
    pdf.text("PRIORITY ACTIONS", margin, y);
    y += 5;
    report.verdict.priorityActions.forEach((action, i) => {
      checkNewPage(10);
      // Number circle
      pdf.setFillColor(77, 155, 255);
      pdf.circle(margin + 2.5, y - 1, 2.5, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(255, 255, 255);
      pdf.text(String(i + 1), margin + 2.5, y + 0.5, { align: "center" });
      // Action text
      const aLines = pdf.splitTextToSize(action, contentW - 10);
      aLines.forEach((line: string, li: number) => {
        checkNewPage(5.5);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(40, 40, 65);
        pdf.text(line, margin + 7, li === 0 ? y : y);
        y += 5.5;
      });
      y += 1;
    });
  }

  y += 5;
  drawLine();

  // ── REVIEWER MATRIX TABLE ────────────────────────────────────
  checkNewPage(40);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(15, 15, 30);
  pdf.text("Reviewer Recommendations", margin, y);
  y += 8;

  // Table header
  pdf.setFillColor(10, 10, 20);
  pdf.rect(margin, y, contentW, 8, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(160, 160, 185);
  pdf.text("REVIEWER", margin + 3, y + 5.5);
  pdf.text("FOCUS", margin + 42, y + 5.5);
  pdf.text("RECOMMENDATION", margin + 90, y + 5.5);
  pdf.text("SCORE", margin + 138, y + 5.5);
  pdf.text("CONF.", margin + 157, y + 5.5);
  y += 9;

  const reviewById = new Map(report.reviews.map((r) => [r.reviewerId, r.review]));

  report.panel.forEach((reviewer, i) => {
    const review = reviewById.get(reviewer.id);
    checkNewPage(10);
    pdf.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 249 : 255, i % 2 === 0 ? 253 : 255);
    pdf.rect(margin, y - 1.5, contentW, 9, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(20, 20, 45);
    pdf.text(reviewer.name ?? `Reviewer ${i + 1}`, margin + 3, y + 4.5);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(80, 80, 105);
    pdf.text(reviewer.role ?? "", margin + 42, y + 4.5);

    if (review) {
      const recCol = getRecColor(review.recommendation);
      pdf.setFillColor(...recCol);
      pdf.circle(margin + 88, y + 3, 1.8, "F");
      pdf.setTextColor(20, 20, 45);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.text(review.recommendation ?? "—", margin + 92, y + 4.5);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text(`${review.score}/10`, margin + 138, y + 4.5);
      pdf.text(`${review.confidence}/5`, margin + 157, y + 4.5);
    } else {
      pdf.setTextColor(140, 140, 160);
      pdf.text("—", margin + 92, y + 4.5);
      pdf.text("—", margin + 138, y + 4.5);
      pdf.text("—", margin + 157, y + 4.5);
    }
    y += 9;
  });

  y += 8;
  drawLine();

  // ── DETAILED REVIEWS ─────────────────────────────────────────
  report.panel.forEach((reviewer, idx) => {
    const review = reviewById.get(reviewer.id);
    if (!review) return;

    checkNewPage(30);

    // Reviewer header
    pdf.setFillColor(245, 248, 255);
    pdf.rect(margin, y, contentW, 11, "F");
    pdf.setFillColor(77, 155, 255);
    pdf.rect(margin, y, 3, 11, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    pdf.setTextColor(15, 15, 30);
    pdf.text(
      `${reviewer.name ?? `Reviewer ${idx + 1}`}  ·  ${reviewer.role ?? ""}`,
      margin + 6,
      y + 7.5
    );

    const recCol = getRecColor(review.recommendation);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...recCol);
    pdf.text(
      `${review.recommendation}  ·  ${review.score}/10`,
      pageW - margin,
      y + 7.5,
      { align: "right" }
    );
    y += 15;

    // Summary
    if (review.summary) {
      pdf.setFillColor(250, 251, 255);
      const sumLines = pdf.splitTextToSize(review.summary, contentW - 6);
      const sumH = sumLines.length * 5.5 + 6;
      pdf.rect(margin, y, contentW, sumH, "F");
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(9);
      pdf.setTextColor(55, 55, 80);
      sumLines.forEach((line: string) => {
        pdf.text(line, margin + 3, y + 5);
        y += 5.5;
      });
      y += 5;
    }

    // Strengths
    if (review.strengths?.length) {
      checkNewPage(12);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(34, 197, 94);
      pdf.text("STRENGTHS", margin, y);
      y += 5;
      review.strengths.forEach((s) => {
        const lines = pdf.splitTextToSize(`+  ${s}`, contentW - 6);
        lines.forEach((line: string) => {
          checkNewPage(5.5);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(35, 35, 60);
          pdf.text(line, margin + 3, y);
          y += 5.5;
        });
      });
      y += 3;
    }

    // Weaknesses
    if (review.weaknesses?.length) {
      checkNewPage(12);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(251, 146, 60);
      pdf.text("WEAKNESSES", margin, y);
      y += 5;
      review.weaknesses.forEach((w) => {
        const lines = pdf.splitTextToSize(`−  ${w}`, contentW - 6);
        lines.forEach((line: string) => {
          checkNewPage(5.5);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(35, 35, 60);
          pdf.text(line, margin + 3, y);
          y += 5.5;
        });
      });
      y += 3;
    }

    // Major comments only
    const majorComments = review.comments?.filter((c) => c.severity === "major") ?? [];
    if (majorComments.length) {
      checkNewPage(12);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(244, 63, 94);
      pdf.text("MAJOR COMMENTS", margin, y);
      y += 5;
      majorComments.forEach((c) => {
        checkNewPage(12);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(90, 90, 115);
        pdf.text(`[${c.section}]`, margin + 3, y);
        y += 4.5;
        const cLines = pdf.splitTextToSize(c.comment, contentW - 8);
        cLines.forEach((line: string) => {
          checkNewPage(5.5);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(35, 35, 60);
          pdf.text(line, margin + 5, y);
          y += 5.5;
        });
        y += 2;
      });
    }

    // Questions for authors
    if (review.questionsForAuthors?.length) {
      checkNewPage(12);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(77, 155, 255);
      pdf.text("QUESTIONS FOR AUTHORS", margin, y);
      y += 5;
      review.questionsForAuthors.forEach((q) => {
        const lines = pdf.splitTextToSize(`?  ${q}`, contentW - 6);
        lines.forEach((line: string) => {
          checkNewPage(5.5);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(35, 35, 60);
          pdf.text(line, margin + 3, y);
          y += 5.5;
        });
      });
      y += 2;
    }

    y += 5;
    if (idx < report.panel.length - 1) drawLine([210, 215, 230]);
  });

  // ── FOOTER ON EVERY PAGE ─────────────────────────────────────
  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFillColor(10, 10, 20);
    pdf.rect(0, pageH - 11, pageW, 11, "F");
    pdf.setFillColor(77, 155, 255);
    pdf.rect(0, pageH - 11, pageW, 0.8, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(110, 110, 135);
    pdf.text(
      "PeerReviewer — AI-generated for guidance only. Not a substitute for formal peer review.",
      margin,
      pageH - 4
    );
    pdf.setTextColor(150, 150, 175);
    pdf.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 4, { align: "right" });
  }

  // ── SAVE ──────────────────────────────────────────────────────
  const safeName = report.paperTitle.slice(0, 40).replace(/[^a-z0-9]/gi, "-");
  pdf.save(`peer-review-${safeName}.pdf`);
}

export default function ExportButton({ report }: { report: ExportReport }) {
  const [loading, setLoading] = useState(false);

  async function downloadPDF() {
    setLoading(true);
    try {
      buildPDF(report);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={downloadPDF}
      disabled={loading}
      className="btn-outline !px-5 !py-2 text-sm"
    >
      {loading ? <Spinner width={17} height={17} /> : <IconDownload width={17} height={17} />}
      {loading ? "Generating PDF..." : "Download PDF"}
    </button>
  );
}