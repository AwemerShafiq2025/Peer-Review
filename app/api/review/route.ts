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
const REVIEWER_TIMEOUT_MS = Number(process.env.REVIEWER_TIMEOUT_MS) || 55_000;
const EDITOR_TIMEOUT_MS = Number(process.env.EDITOR_TIMEOUT_MS) || 25_000;
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

// ── FIX 1: Majority-vote aggregation ────────────────────────────────────────
// Bug: pure average 5.5 → "Minor Revision" even when 3/4 said "Major Revision"
// Fix: majority vote wins; average is a tiebreaker only
const DECISION_RANK: Record<FinalDecision, number> = {
  Accepted: 3,
  "Minor Revision": 2,
  "Major Revision": 1,
  Rejected: 0,
};

function recommendationToDecision(rec: Recommendation): FinalDecision {
  if (rec === "Accept") return "Accepted";
  if (rec === "Reject") return "Rejected";
  if (rec === "Minor Revision") return "Minor Revision";
  return "Major Revision";
}

function aggregateDecision(
  completed: { reviewer: ReviewerConfig; review: ReviewResult }[]
): FinalDecision {
  const votes: Record<FinalDecision, number> = {
    Accepted: 0,
    "Minor Revision": 0,
    "Major Revision": 0,
    Rejected: 0,
  };
  for (const { review } of completed) {
    votes[recommendationToDecision(review.recommendation)]++;
  }
  const total = completed.length;
  const avg = completed.reduce((s, c) => s + c.review.score, 0) / total;

  // Strict majority (e.g. 3/4 = 75% > 50%) → that decision wins outright
  for (const decision of DECISIONS) {
    if (votes[decision] / total > 0.5) {
      if (avg < 4) return "Rejected";
      return decision;
    }
  }

  // No majority → most-voted wins; ties go to harsher decision
  let best: FinalDecision = "Major Revision";
  let bestCount = -1;
  for (const decision of DECISIONS) {
    if (
      votes[decision] > bestCount ||
      (votes[decision] === bestCount && DECISION_RANK[decision] < DECISION_RANK[best])
    ) {
      best = decision;
      bestCount = votes[decision];
    }
  }
  if (avg < 4) return "Rejected";
  return best;
}
// ────────────────────────────────────────────────────────────────────────────

/**
 * Deterministic editorial decision derived straight from the completed reviews.
 * Used as a guaranteed fallback when the editor model is unavailable or times
 * out, so the user ALWAYS gets a final decision rather than just the reviews.
 */
function fallbackVerdict(
  completed: { reviewer: ReviewerConfig; review: ReviewResult }[],
  quartile: Quartile
): EditorVerdict {
  const scores = completed.map((c) => c.review.score);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Use robust majority-vote instead of pure average threshold
  const decision = aggregateDecision(completed);

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

// ── FIX 2: Retry with exponential backoff ───────────────────────────────────
// Bug: 1 attempt → timeout → immediate fallback
// Fix: up to MAX_RETRIES retries with exponential delay (800ms → 1600ms → …)
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 800;

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1} failed — retrying in ${delay}ms…`, err);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
  throw lastError;
}

async function runReviewer(
  reviewer: ReviewerConfig,
  paperText: string,
  quartile: Quartile
): Promise<ReviewResult> {
  const text = await withRetry(() =>
    complete({
      model: reviewer.model,
      system: buildReviewerSystem(reviewer, quartile),
      user: buildReviewerUser(paperText),
      temperature: 0.5,
      maxTokens: 1300,
      timeoutMs: REVIEWER_TIMEOUT_MS,
    })
  );
  return sanitizeReview(extractJson<any>(text));
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

        // Run the reviewers concurrently, but stagger their launches by a few
        // hundred ms so we don't hit the shared NVIDIA endpoint with a burst of
        // simultaneous requests (a common trigger for 429 rate-limiting). Each
        // streams its result the moment it finishes.
        const completed: { reviewer: ReviewerConfig; review: ReviewResult }[] = [];
        await Promise.all(
          REVIEWERS.map(async (r, i) => {
            if (i > 0) await new Promise((res) => setTimeout(res, i * 600));
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
        );

        if (completed.length === 0) {
          for (const reviewer of REVIEWERS) {
            const review = fallbackReview(reviewer, quartile);
            completed.push({ reviewer, review });
            send({ type: "reviewer_done", reviewerId: reviewer.id, review });
          }
        }

        // ── FIX 3: 3-layer editor fallback ──────────────────────────────────
        // Layer 1: primary editor model
        // Layer 2: lighter/faster model if primary fails
        // Layer 3: deterministic majority-vote verdict (always works)
        const FALLBACK_EDITOR_MODEL = "mistralai/mixtral-8x7b-instruct-v0.1";
        send({ type: "editor_start" });
        // Initialize with deterministic fallback — TypeScript guarantee that verdict is always assigned
        let verdict: EditorVerdict = fallbackVerdict(completed, quartile);
        let editorDone = false;

        // Layer 1 — primary editor

        try {
          const text = await complete({
            model: EDITOR.model,
            system: buildEditorSystem(quartile),
            user: buildEditorUser(completed),
            temperature: 0.4,
            maxTokens: 800,
            timeoutMs: EDITOR_TIMEOUT_MS,
          });
          verdict = sanitizeVerdict(extractJson<any>(text));
          editorDone = true;
        } catch (primaryErr) {
          console.warn("Primary editor failed — trying lighter model…", primaryErr);
        }

        // Layer 2 — lighter model
        if (!editorDone) {
          try {
            const text = await complete({
              model: FALLBACK_EDITOR_MODEL,
              system: buildEditorSystem(quartile),
              user: buildEditorUser(completed),
              temperature: 0.4,
              maxTokens: 600,
              timeoutMs: Math.floor(EDITOR_TIMEOUT_MS * 0.7),
            });
            verdict = sanitizeVerdict(extractJson<any>(text));
            // Override decision with majority-vote to ensure correctness
            verdict!.decision = aggregateDecision(completed);
            editorDone = true;
          } catch (fallbackErr) {
            console.warn("Fallback editor also failed — using deterministic verdict.", fallbackErr);
          }
        }

        // Layer 3 — deterministic (always works)
        if (!editorDone) {
          verdict = fallbackVerdict(completed, quartile);
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
