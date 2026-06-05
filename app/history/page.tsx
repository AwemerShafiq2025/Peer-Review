import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import sql from "@/lib/db";
import Navbar from "@/components/Navbar";
import { IconDoc } from "@/components/icons";

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

export default async function HistoryPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!session?.user || !userId) {
    redirect("/login");
  }

  const reviews = (await sql.query(
    `SELECT id, paper_title, quartile, verdict, avg_score, created_at
     FROM reviews WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  )) as ReviewRow[];

  return (
    <main id="top" className="min-h-screen bg-base">
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your Review History</h1>
            <p className="mt-2 text-text-secondary">Past review runs saved to your account.</p>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="card flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-md bg-accent/15 text-accent ring-1 ring-accent/25">
              <IconDoc width={22} height={22} />
            </span>
            <h2 className="text-xl font-semibold">No reviews yet.</h2>
            <p className="mt-2 text-text-secondary">
              Your reviewed papers will appear here once you submit one.
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
                  className="grid gap-4 px-5 py-5 md:grid-cols-[1.7fr_0.5fr_0.9fr_0.55fr_0.8fr_0.7fr] md:items-center"
                >
                  <div>
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
                    <span className={`inline-flex rounded-pill px-3 py-1 text-xs font-semibold ring-1 ${verdictClass(review.verdict)}`}>
                      {review.verdict || "Pending"}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-text-primary">{formatScore(review.avg_score)}</p>
                  <p className="hidden text-sm text-text-secondary md:block">{formatDate(review.created_at)}</p>

                  <div className="md:text-right">
                    <Link href={`/history/${review.id}`} className="btn-outline !px-4 !py-2 text-sm">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
