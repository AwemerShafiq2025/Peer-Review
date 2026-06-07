import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import sql from "@/lib/db";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { IconDoc } from "@/components/icons";
import DeleteReviewButton from "@/components/DeleteReviewButton";
import EditTitleButton from "@/components/EditTitleButton";
import HistorySearch from "@/components/HistorySearch";

type ReviewRow = {
  id: string;
  paper_title: string | null;
  quartile: string | null;
  verdict: string | null;
  avg_score: string | number | null;
  created_at: string | Date;
};

function verdictClass(verdict: string | null) {
  switch (verdict) {
    case "Accepted":
      return "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20";
    case "Minor Revision":
      return "bg-accent/10 text-accent ring-accent/25";
    case "Major Revision":
      return "bg-amber-500/10 text-amber-300 ring-amber-400/20";
    case "Rejected":
      return "bg-rose-500/10 text-rose-300 ring-rose-400/20";
    default:
      return "bg-white/5 text-text-secondary ring-white/10";
  }
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

function displayTitle(value: string | null) {
  return (value || "Untitled Paper").replace(/^Title:\s*/i, "");
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams?: { q?: string; verdict?: string };
}) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!session?.user || !userId) {
    redirect("/login");
  }

  const q = searchParams?.q?.trim() ?? "";
  const verdictFilter = searchParams?.verdict ?? "";

  // Get total count for this user (unfiltered — for badge)
  const countResult = (await sql.query(
    "SELECT COUNT(*)::int AS total FROM reviews WHERE user_id = $1",
    [userId]
  )) as { total: number }[];
  const totalCount = countResult[0]?.total ?? 0;

  const reviews = (await sql.query(
    `SELECT id, paper_title, quartile, verdict, avg_score, created_at
     FROM reviews
     WHERE user_id = $1
     ${q ? "AND LOWER(paper_title) LIKE LOWER($2)" : ""}
     ${verdictFilter ? `AND verdict = $${q ? "3" : "2"}` : ""}
     ORDER BY created_at DESC`,
    [
      userId,
      ...(q ? [`%${q}%`] : []),
      ...(verdictFilter ? [verdictFilter] : []),
    ]
  )) as ReviewRow[];

  return (
    <main id="top" className="min-h-screen bg-base">
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        {/* Heading with count badge */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Your Review History
              </h1>
              {totalCount > 0 && (
                <span className="inline-flex items-center rounded-pill bg-accent/15 px-3 py-1 text-sm font-semibold text-accent ring-1 ring-accent/30">
                  {totalCount} {totalCount === 1 ? "review" : "reviews"}
                </span>
              )}
            </div>
            <p className="mt-2 text-text-secondary">
              Past review runs saved to your account.
            </p>
          </div>
          <Link href="/#submit" className="btn-primary shrink-0 !px-5 !py-2.5 text-sm">
            New Review →
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="mb-6 h-12 rounded-md bg-elevated/50 animate-pulse" />
          }
        >
          <HistorySearch />
        </Suspense>

        {reviews.length === 0 ? (
          <div className="card flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-md bg-accent/15 text-accent ring-1 ring-accent/25">
              <IconDoc width={22} height={22} />
            </span>
            <h2 className="mt-4 text-xl font-semibold">
              {q || verdictFilter ? "No matching reviews." : "No reviews yet."}
            </h2>
            <p className="mt-2 text-text-secondary">
              {q || verdictFilter
                ? "Try a different search or filter."
                : "Your reviewed papers will appear here once you submit one."}
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="hidden grid-cols-[1.7fr_0.5fr_0.9fr_0.55fr_0.8fr_0.7fr] gap-4 border-b border-subtle px-5 py-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary md:grid">
              <span>Paper</span>
              <span>Quartile</span>
              <span>Verdict</span>
              <span>Score</span>
              <span>Date</span>
              <span className="text-right">Details</span>
            </div>

            <div className="divide-y divide-subtle">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="group grid gap-4 px-5 py-5 md:grid-cols-[1.7fr_0.5fr_0.9fr_0.55fr_0.8fr_0.7fr] md:items-center"
                >
                  <div className="flex items-center gap-1">
                    <EditTitleButton
                      reviewId={review.id}
                      currentTitle={displayTitle(review.paper_title)}
                    />
                    <p className="font-semibold">{displayTitle(review.paper_title)}</p>
                    <p className="mt-1 text-xs text-text-tertiary md:hidden">
                      {formatDate(review.created_at)}
                    </p>
                  </div>

                  <div>
                    <span className="inline-flex rounded-pill bg-accent/10 px-3 py-1 text-xs font-semibold text-accent ring-1 ring-accent/25">
                      {review.quartile || "N/A"}
                    </span>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-pill px-3 py-1 text-xs font-semibold ring-1 ${verdictClass(review.verdict)}`}
                    >
                      {review.verdict || "Pending"}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-text-primary">
                    {formatScore(review.avg_score)}
                  </p>
                  <p className="hidden text-sm text-text-secondary md:block">
                    {formatDate(review.created_at)}
                  </p>

                  <div className="flex items-center justify-end gap-2 md:text-right">
                    <DeleteReviewButton reviewId={review.id} />
                    <Link
                      href={`/history/${review.id}`}
                      className="btn-outline !px-4 !py-2 text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}