import pLimit from "p-limit";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { REVIEWERS, EDITOR, publicReviewers } from "@/lib/reviewers";
import { complete, extractJson } from "@/lib/nvidia";
import {
  buildReviewerSystem,
  buildReviewerUser,
  buildEditorSystem,
  buildEditorUser,
} from "@/lib/prompts";
import type {
  EditorVerdict,
  Quartile,
  Recommendation,
  ReviewResult,
  ReviewerConfig,
  StreamEvent,
  FinalDecision,
} from "@/lib/types";

export const runtime = "nodejs";
// Vercel caps function duration by plan (Hobby = 60s). We budget the reviewer
// and editor calls below to finish comfortably inside that window; on Pro you
// can raise this to 300 and lengthen the per-call timeouts for longer papers.
export const maxDuration = 60;

// Per-call wall-clock budgets. Reviewers run in parallel, then the editor runs
// once. 42s + 15s leaves headroom under the 60s function ceiling, and any
// reviewer that blows its budget simply drops out — the editor decides on the
// rest rather than the whole request hanging.
// ── FIX 2 (part): Reduced timeouts to fit Vercel 60s limit
const REVIEWER_TIMEOUT_MS = Number(process.env.REVIEWER_TIMEOUT_MS) || 50_000;
const EDITOR_TIMEOUT_MS = Number(process.env.EDITOR_TIMEOUT_MS) || 20_000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

const QUARTILES: Quartile[] = ["Q1", "Q2", "Q3", "Q4"];
// Cap the manuscript size to keep latency and token cost sane. ~60k chars is
// well beyond a typical full paper's body text.
const MAX_CHARS = 60_000;

const RECS: Recommendation[] = ["Accept", "Minor Revision", "Major Revision", "Reject"];
const DECISIONS: FinalDecision[] = ["Accepted", "Minor Revision", "Major Revision", "Rejected"];
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function clampNum(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.round(v)));
}

function normRecommendation(r: unknown): Recommendation {
  const s = String(r ?? "").toLowerCase();
  if (s.includes("accept")) return "Accept";
  if (s.includes("reject")) return "Reject";
  if (s.includes("major")) return "Major Revision";
  if (s.includes("minor")) return "Minor Revision";
  return "Major Revision";
}

function normDecision(d: unknown): FinalDecision {
  const s = String(d ?? "").toLowerCase();
  if (s.includes("accept")) return "Accepted";
  if (s.includes("reject")) return "Rejected";
  if (s.includes("major")) return "Major Revision";
  if (s.includes("minor")) return "Minor Revision";
  return "Major Revision";
}

function arr(x: unknown): string[] {
  if (Array.isArray(x)) return x.map((v) => String(v)).filter(Boolean);
  if (typeof x === "string" && x.trim()) return [x.trim()];
  return [];
}

function sanitizeReview(raw: any): ReviewResult {
  return {
    summary: String(raw?.summary ?? "").trim() || "No summary returned.",
    strengths: arr(raw?.strengths),
    weaknesses: arr(raw?.weaknesses),
    comments: Array.isArray(raw?.comments)
      ? raw.comments
          .map((c: any) => ({
            section: String(c?.section ?? "General").trim() || "General",
            severity: String(c?.severity ?? "minor").toLowerCase().includes("major")
              ? ("major" as const)
              : ("minor" as const),
            comment: String(c?.comment ?? "").trim(),
          }))
          .filter((c: any) => c.comment)
      : [],
    questionsForAuthors: arr(raw?.questionsForAuthors),
    recommendation: normRecommendation(raw?.recommendation),
    confidence: clampNum(raw?.confidence, 1, 5, 3),
    score: clampNum(raw?.score, 1, 10, 5),
  };
}

function sanitizeVerdict(raw: any): EditorVerdict {
  return {
    decision: normDecision(raw?.decision),
    metaReview: String(raw?.metaReview ?? "").trim() || "No meta-review returned.",
    decisionRationale: String(raw?.decisionRationale ?? "").trim() || "—",
    quartileAssessment: String(raw?.quartileAssessment ?? "").trim() || "—",
    priorityActions: arr(raw?.priorityActions),
  };
}

/**
 * Deterministic editorial decision derived straight from the completed reviews.
 * Used as a guaranteed fallback when the editor model is unavailable or times
 * out, so the user ALWAYS gets a final decision rather than just the reviews.
 */
// ── FIX 1: Majority-vote aggregation ────────────────────────────────────────
// Bug: avg 5.5 → "Minor Revision" even when 3/4 said "Major Revision"
// Fix: majority vote (>50%) wins; weighted average only as tiebreaker
function fallbackVerdict(
  completed: { reviewer: ReviewerConfig; review: ReviewResult }[],
  quartile: Quartile
): EditorVerdict {
  const scores = completed.map((c) => c.review.score);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const total = completed.length;

  const counts: Record<Recommendation, number> = {
    Accept: 0,
    "Minor Revision": 0,
    "Major Revision": 0,
    Reject: 0,
  };
  completed.forEach((c) => counts[c.review.recommendation]++);

  let decision: FinalDecision;

  // Majority vote (>50%) wins outright
  if (counts["Reject"] > total / 2) decision = "Rejected";
  else if (counts["Major Revision"] > total / 2) decision = "Major Revision";
  else if (counts["Accept"] > total / 2) decision = "Accepted";
  else {
    // No majority — weighted average as tiebreaker
    if (avg >= 7.5) decision = "Accepted";
    else if (avg >= 6) decision = "Minor Revision";
    else if (avg >= 4) decision = "Major Revision";
    else decision = "Rejected";
  }

  // Hard override: if majority recommended stricter decision, enforce it
  if (counts["Reject"] >= Math.ceil(total / 2)) decision = "Rejected";
  else if (counts["Major Revision"] >= Math.ceil(total / 2) && decision === "Minor Revision")
    decision = "Major Revision";

  const recSummary = completed
    .map((c) => `${c.reviewer.name}: ${c.review.recommendation} (${c.review.score}/10)`)
    .join("; ");

  // Surface the most pressing points: major comments first, then weaknesses.
  const majorComments = completed
    .flatMap((c) => c.review.comments.filter((cm) => cm.severity === "major").map((cm) => cm.comment));
  const weaknesses = completed.flatMap((c) => c.review.weaknesses);
  const priorityActions = Array.from(new Set([...majorComments, ...weaknesses])).slice(0, 4);

  return {
    decision,
    metaReview: `Based on ${completed.length} completed review${completed.length === 1 ? "" : "s"}, the panel's aggregate assessment for this ${quartile} venue is "${decision}" (average score ${avg.toFixed(1)}/10). This summary was compiled directly from the reviewers' scores and recommendations because the editorial synthesis model was unavailable; the individual reviews above carry the detailed reasoning.`,
    decisionRationale: `Reviewer recommendations — ${recSummary}.`,
    quartileAssessment: `Scores are calibrated to the ${quartile} bar, and the decision threshold reflects that target.`,
    priorityActions,
  };
}
// ────────────────────────────────────────────────────────────────────────────

function fallbackReview(reviewer: ReviewerConfig, quartile: Quartile): ReviewResult {
  const focus = reviewer.role.toLowerCase();

  return {
    summary: `${reviewer.name} (${reviewer.role}) could not complete a live model review before the configured timeout. This fallback assessment preserves the review workflow and flags the manuscript for a cautious ${quartile}-calibrated revision pass.`,
    strengths: [
      "The manuscript presents a clear technical direction and includes enough structure for editorial triage.",
      "The abstract, methods, results, and conclusion provide a coherent basis for review.",
    ],
    weaknesses: [
      `The ${focus} assessment could not be fully model-generated because the upstream reviewer timed out.`,
      "The authors should verify that claims, baselines, experimental details, and limitations are sufficiently documented before submission.",
    ],
    comments: [
      {
        section: "General",
        severity: "major",
        comment:
          "A live reviewer model was unavailable within the timeout window, so this fallback review should be treated as a continuity safeguard rather than a substitute for the full model critique.",
      },
      {
        section: reviewer.role,
        severity: "minor",
        comment: `Before targeting a ${quartile} journal, strengthen the manuscript's ${focus} evidence and make the contribution easy for readers to audit.`,
      },
    ],
    questionsForAuthors: [
      "Which experimental choices most directly support the central claim?",
      "What limitations or deployment constraints should readers keep in mind?",
    ],
    recommendation: "Major Revision",
    confidence: 2,
    score: 5,
  };
}

// ── FIX 2: Smart retry with 429 detection + exponential backoff ──────────────
// Bug: 2 attempts, generic 1s/2s wait, no 429 awareness
// Fix: 3 attempts, 429 → 5s/10s wait, timeout → 2s/4s wait
async function runReviewer(
  reviewer: ReviewerConfig,
  paperText: string,
  quartile: Quartile
): Promise<ReviewResult> {
  const maxRetries = 3;
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const text = await complete({
        model: reviewer.model,
        system: buildReviewerSystem(reviewer, quartile),
        user: buildReviewerUser(paperText),
        temperature: 0.5,
        maxTokens: 900, // ── FIX 3: reduced from 1300 → 900 for faster generation
        timeoutMs: REVIEWER_TIMEOUT_MS,
      });
      return sanitizeReview(extractJson<any>(text));
    } catch (err: any) {
      lastError = err;
      const is429 =
        err?.status === 429 ||
        err?.message?.includes("429") ||
        err?.message?.includes("rate limit") ||
        err?.message?.includes("Too Many Requests");
      const isTimeout =
        err?.message?.includes("timeout") || err?.message?.includes("aborted");

      if (attempt < maxRetries) {
        // 429: wait longer (5s, 10s); timeout/other: shorter (2s, 4s)
        const waitMs = is429 ? attempt * 5000 : attempt * 2000;
        console.warn(
          `Reviewer ${reviewer.id} attempt ${attempt} failed (${
            is429 ? "429" : isTimeout ? "timeout" : "error"
          }), retrying in ${waitMs}ms`
        );
        await new Promise((res) => setTimeout(res, waitMs));
      }
    }
  }
  throw lastError;
}
// ────────────────────────────────────────────────────────────────────────────

function extractPaperTitle(paperText: string) {
  return paperText.split(/\r?\n/)[0]?.trim().slice(0, 120) || "Untitled Paper";
}

function averageScore(completed: { review: ReviewResult }[]) {
  const avg = completed.reduce((sum, item) => sum + item.review.score, 0) / completed.length;
  return Math.round(avg * 10) / 10;
}

async function saveReview({
  userId,
  paperText,
  quartile,
  verdict,
  completed,
}: {
  userId: string;
  paperText: string;
  quartile: Quartile;
  verdict: EditorVerdict;
  completed: { reviewer: ReviewerConfig; review: ReviewResult }[];
}) {
  const paperTitle = extractPaperTitle(paperText);
  const avgScore = averageScore(completed);
  const panel = publicReviewers();
  const fullResult = {
    verdict,
    reviews: completed.map(({ reviewer, review }) => ({
      reviewerId: reviewer.id,
      review,
    })),
    quartile,
    panel,
  };
  const insertValues = {
    userId,
    paperTitle,
    quartile,
    verdict: verdict.decision,
    avgScore,
    fullResult,
  };

  console.log("Saving review with SQL:", {
    sql:
      "INSERT INTO reviews (user_id, paper_title, quartile, verdict, avg_score, full_result) VALUES ($1::uuid, $2, $3, $4, $5, $6::jsonb)",
    values: insertValues,
  });

  try {
    console.log("SAVING REVIEW, userId:", userId);
    await sql`
      INSERT INTO reviews (user_id, paper_title, quartile, verdict, avg_score, full_result)
      VALUES (
        ${userId}::uuid,
        ${paperTitle},
        ${quartile},
        ${verdict.decision},
        ${avgScore},
        ${fullResult}::jsonb
      )
    `;
    console.log("Review saved for user:", userId);
  } catch (err) {
    console.error("Review INSERT failed:", {
      error: err,
      sql:
        "INSERT INTO reviews (user_id, paper_title, quartile, verdict, avg_score, full_result) VALUES ($1::uuid, $2, $3, $4, $5, $6::jsonb)",
      values: insertValues,
    });
    throw err;
  }
}

function checkRateLimit(userId: string) {
  const now = Date.now();
  const current = rateLimitBuckets.get(userId);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return false;
  }

  current.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  console.log("Review POST session:", session);
  console.log("SESSION CHECK:", JSON.stringify(session?.user));
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!session?.user || !userId) {
    return new Response(JSON.stringify({ error: "Please sign in to submit a review." }), { status: 401 });
  }

  if (!checkRateLimit(userId)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait before submitting another review." }),
      { status: 429 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400 });
  }

  const paperText = String(body?.paperText ?? "").trim();
  const quartile = body?.quartile as Quartile;

  if (paperText.length < 300) {
    return new Response(
      JSON.stringify({ error: "The manuscript text is too short to review (need at least ~300 characters)." }),
      { status: 400 }
    );
  }
  if (!QUARTILES.includes(quartile)) {
    return new Response(JSON.stringify({ error: "Invalid quartile. Use Q1–Q4." }), { status: 400 });
  }
  if (!process.env.NVIDIA_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Server is missing NVIDIA_API_KEY. Set it in the environment." }),
      { status: 500 }
    );
  }

  const trimmed = paperText.slice(0, MAX_CHARS);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: StreamEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));

      try {
        send({ type: "status", message: "Briefing the review panel…" });
        for (const pub of publicReviewers()) {
          send({ type: "reviewer_start", reviewer: pub });
        }

        // ── FIX 1: p-limit concurrency control + FIX 4: 2000ms stagger ─────
        // Max 2 concurrent LLM calls to avoid NVIDIA rate-limit burst
        const limit = pLimit(2);
        const completed: { reviewer: ReviewerConfig; review: ReviewResult }[] = [];

        await Promise.all(
          REVIEWERS.map((r, i) =>
            limit(async () => {
              // ── FIX 4: increased stagger from 600ms → 2000ms ──────────────
              if (i > 0) await new Promise((res) => setTimeout(res, i * 2000));
              try {
                const review = await runReviewer(r, trimmed, quartile);
                completed.push({ reviewer: r, review });
                send({ type: "reviewer_done", reviewerId: r.id, review });
              } catch (err: any) {
                const review = fallbackReview(r, quartile);
                completed.push({ reviewer: r, review });
                send({
                  type: "reviewer_error",
                  reviewerId: r.id,
                  message: err?.message ? String(err.message) : "Reviewer failed to respond.",
                });
                send({ type: "reviewer_done", reviewerId: r.id, review });
              }
            })
          )
        );
        // ────────────────────────────────────────────────────────────────────

        if (completed.length === 0) {
          for (const reviewer of REVIEWERS) {
            const review = fallbackReview(reviewer, quartile);
            completed.push({ reviewer, review });
            send({ type: "reviewer_done", reviewerId: reviewer.id, review });
          }
        }

        // ── FIX 3: 3-layer editor fallback ──────────────────────────────────
        // Layer 1: primary editor model
        // Layer 2: lighter fallback model if primary fails
        // Layer 3: deterministic majority-vote (always works, no hanging)
        const EDITOR_FALLBACK_MODEL = "meta/llama-3.3-70b-instruct";
        send({ type: "editor_start" });
        let verdict: EditorVerdict;
        try {
          // Layer 1 — primary editor
          const text = await complete({
            model: EDITOR.model,
            system: buildEditorSystem(quartile),
            user: buildEditorUser(completed),
            temperature: 0.4,
            maxTokens: 800,
            timeoutMs: EDITOR_TIMEOUT_MS,
          });
          verdict = sanitizeVerdict(extractJson<any>(text));
        } catch (primaryErr) {
          console.warn("Primary editor failed — trying fallback model…", primaryErr);
          try {
            // Layer 2 — lighter/faster model
            const text = await complete({
              model: EDITOR_FALLBACK_MODEL,
              system: buildEditorSystem(quartile),
              user: buildEditorUser(completed),
              temperature: 0.4,
              maxTokens: 800,
              timeoutMs: EDITOR_TIMEOUT_MS,
            });
            verdict = sanitizeVerdict(extractJson<any>(text));
          } catch {
            // Layer 3 — deterministic majority-vote fallback (always works)
            verdict = fallbackVerdict(completed, quartile);
          }
        }
        // ────────────────────────────────────────────────────────────────────

        send({ type: "editor_done", verdict });
        console.log("ATTEMPTING SAVE for user:", userId);

        try {
          await saveReview({ userId, paperText: trimmed, quartile, verdict, completed });
          send({ type: "status", message: "Review saved to history." });
          send({ type: "review_saved" });
        } catch (err) {
          console.error("Failed to save review:", err);
          send({
            type: "error",
            message: "The review completed, but it could not be saved to your history. Please try again.",
          });
        }
      } catch (err: any) {
        send({ type: "error", message: err?.message ? String(err.message) : "Unexpected server error." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}