import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import sql from "@/lib/db";
import DecisionBanner from "@/components/DecisionBanner";
import ExportButton from "@/components/ExportButton";
import ReviewerCard from "@/components/ReviewerCard";
import type { EditorVerdict, PublicReviewer, Recommendation, ReviewResult, Quartile } from "@/lib/types";

type ReviewRow = {
  id: string;
  user_id: string;
  paper_title: string | null;
  quartile: Quartile | null;
  verdict: string | null;
  avg_score: string | number | null;
  full_result: SavedResult | string | null;
  created_at: string | Date;
};

type SavedResult = {
  verdict: EditorVerdict;
  reviews: { reviewerId: string; review: ReviewResult }[];
  quartile: Quartile;
  panel: PublicReviewer[];
};

const REC_STYLE: Record<Recommendation, string> = {
  Accept: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  "Minor Revision": "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  "Major Revision": "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Reject: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

function parseResult(value: ReviewRow["full_result"]): SavedResult | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as SavedResult;
    } catch {
      return null;
    }
  }

  return value;
}

function normalizeResult(value: SavedResult | null): SavedResult | null {
  if (!value || !value.verdict || !Array.isArray(value.reviews) || !Array.isArray(value.panel)) {
    return null;
  }

  return {
    verdict: {
      decision: value.verdict.decision,
      metaReview: String(value.verdict.metaReview ?? ""),
      decisionRationale: String(value.verdict.decisionRationale ?? ""),
      quartileAssessment: String(value.verdict.quartileAssessment ?? ""),
      priorityActions: Array.isArray(value.verdict.priorityActions) ? value.verdict.priorityActions : [],
    },
    reviews: value.reviews
      .filter((item) => item?.reviewerId && item?.review)
      .map((item) => ({
        reviewerId: String(item.reviewerId),
        review: {
          summary: String(item.review.summary ?? ""),
          strengths: Array.isArray(item.review.strengths) ? item.review.strengths : [],
          weaknesses: Array.isArray(item.review.weaknesses) ? item.review.weaknesses : [],
          comments: Array.isArray(item.review.comments) ? item.review.comments : [],
          questionsForAuthors: Array.isArray(item.review.questionsForAuthors)
            ? item.review.questionsForAuthors
            : [],
          recommendation: item.review.recommendation,
          confidence: Number(item.review.confidence) || 0,
          score: Number(item.review.score) || 0,
        },
      })),
    quartile: value.quartile,
    panel: value.panel.map((reviewer, index) => ({
      id: String(reviewer?.id ?? value.reviews[index]?.reviewerId ?? `reviewer-${index + 1}`),
      name: String(reviewer?.name ?? `Reviewer ${index + 1}`),
      role: String(reviewer?.role ?? "Peer Review"),
      blurb: String(reviewer?.blurb ?? ""),
      hue: String(reviewer?.hue ?? "#4D9BFF"),
    })),
  };
}

function displayTitle(value: string | null) {
  return (value || "Untitled Paper").replace(/^Title:\s*/i, "");
}

function DetailError() {
  return (
    <main className="min-h-screen bg-base px-6 py-12">
      <section className="mx-auto max-w-3xl">
        <Link href="/history" className="btn-outline !px-4 !py-2 text-sm">
          Back to history
        </Link>
        <div className="card mt-6 p-8 text-center">
          <h1 className="text-2xl font-bold">Could not load review details</h1>
          <p className="mt-2 text-text-secondary">
            Could not load review details. The data may be from an older format.
          </p>
        </div>
      </section>
    </main>
  );
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatScore(value: string | number | null) {
  if (value === null) return "N/A";

  const score = Number(value);

  return Number.isFinite(score) ? `${score.toFixed(1).replace(/\.0$/, "")}/10` : "N/A";
}

export default async function ReviewDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!session?.user || !userId) {
    redirect("/login");
  }

  const rows = (await sql.query("SELECT * FROM reviews WHERE id = $1 AND user_id = $2", [
    params.id,
    userId,
  ])) as ReviewRow[];
  const review = rows[0];

  if (!review) {
    return (
      <main className="min-h-screen bg-base px-6 py-12">
        <section className="mx-auto max-w-3xl">
          <Link href="/history" className="btn-outline !px-4 !py-2 text-sm">
            Back to history
          </Link>
          <div className="card mt-6 p-8 text-center">
            <h1 className="text-2xl font-bold">Review not found</h1>
            <p className="mt-2 text-text-secondary">This review does not exist or is not attached to your account.</p>
          </div>
        </section>
      </main>
    );
  }

  let result: SavedResult;
  try {
    console.log("Raw saved review full_result:", review.full_result);
    const parsed = normalizeResult(parseResult(review.full_result));

    if (!parsed) {
      throw new Error("Malformed saved review result.");
    }

    result = parsed;
  } catch (error) {
    console.error("Could not load review details:", error);
    return <DetailError />;
  }

  const reviewById = new Map(result.reviews.map((item) => [item.reviewerId, item.review]));
  const paperTitle = displayTitle(review.paper_title);

  return (
    <main className="min-h-screen bg-base px-6 py-12">
      <section className="mx-auto max-w-6xl">
        <Link href="/history" className="btn-outline !px-4 !py-2 text-sm">
          Back to history
        </Link>

        <div className="mt-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {paperTitle}
              </h1>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="chip !py-1 font-mono text-xs">{review.quartile || result.quartile}</span>
                <span className="chip !py-1 text-xs">{formatDate(review.created_at)}</span>
                <span className="chip !py-1 font-mono text-xs">avg score {formatScore(review.avg_score)}</span>
              </div>
            </div>
            <ExportButton
              report={{
                paperTitle,
                date: review.created_at,
                quartile: review.quartile || result.quartile,
                verdict: result.verdict,
                panel: result.panel,
                reviews: result.reviews,
              }}
            />
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <DecisionBanner status="done" verdict={result.verdict} quartile={result.quartile} />

          <div className="card overflow-hidden p-0">
            <div className="border-b border-subtle p-5">
              <h2 className="font-semibold">Reviewer recommendations</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-subtle text-xs uppercase tracking-wide text-text-tertiary">
                    <th className="p-4 font-medium">Reviewer</th>
                    <th className="p-4 font-medium">Recommendation</th>
                    <th className="p-4 text-right font-medium">Score</th>
                    <th className="p-4 text-right font-medium">Conf.</th>
                  </tr>
                </thead>
                <tbody>
                  {result.panel.map((reviewer) => {
                    const savedReview = reviewById.get(reviewer.id);

                    return (
                      <tr key={reviewer.id} className="border-b border-subtle/60 last:border-0">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: reviewer.hue ?? "#4D9BFF" }} />
                            <div>
                              <div className="font-medium leading-tight">{reviewer.name ?? "Reviewer"}</div>
                              <div className="text-xs text-text-tertiary">{reviewer.role ?? "Peer Review"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {savedReview ? (
                            <span className={`inline-block rounded-pill px-2.5 py-0.5 text-xs font-semibold ring-1 ${REC_STYLE[savedReview.recommendation] ?? "bg-white/5 text-text-secondary ring-white/10"}`}>
                              {savedReview.recommendation}
                            </span>
                          ) : (
                            <span className="text-xs text-text-tertiary">unavailable</span>
                          )}
                        </td>
                        <td className="p-4 text-right font-mono text-text-secondary">
                          {savedReview ? `${savedReview.score}/10` : "N/A"}
                        </td>
                        <td className="p-4 text-right font-mono text-text-secondary">
                          {savedReview ? `${savedReview.confidence}/5` : "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Full reviewer reports</h2>
            <div className="grid gap-5 lg:grid-cols-2">
              {result.panel.map((reviewer) => {
                const savedReview = reviewById.get(reviewer.id);

                if (!savedReview) return null;

                return (
                  <details key={reviewer.id} className="group">
                    <summary className="mb-3 cursor-pointer select-none rounded-md border border-subtle bg-elevated px-4 py-3 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary">
                      {reviewer.name} full review
                      <span className="float-right text-text-tertiary transition-transform group-open:rotate-90">
                        &gt;
                      </span>
                    </summary>
                    <ReviewerCard reviewer={reviewer} status="done" review={savedReview} />
                  </details>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
