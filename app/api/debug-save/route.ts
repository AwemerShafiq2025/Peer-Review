import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  const sessionInfo = {
    hasSession: !!session,
    userId: session?.user?.id ?? null,
    userEmail: session?.user?.email ?? null,
  };

  let dbWrite = null;
  let dbError = null;
  if (session?.user?.id) {
    try {
      await sql`
        INSERT INTO reviews
        (user_id, paper_title, quartile, verdict, avg_score, full_result)
        VALUES (
          ${session.user.id}::uuid,
          ${"Debug Test Paper"},
          ${"Q2"},
          ${"Minor Revision"},
          ${6.5},
          ${{ test: true }}::jsonb
        )
      `;
      dbWrite = "SUCCESS";
    } catch (e: any) {
      dbError = e?.message ?? String(e);
    }
  }

  let reviews = null;
  let readError = null;
  if (session?.user?.id) {
    try {
      reviews = await sql`
        SELECT id, paper_title, verdict, created_at
        FROM reviews
        WHERE user_id = ${session.user.id}::uuid
        ORDER BY created_at DESC
        LIMIT 5
      `;
    } catch (e: any) {
      readError = e?.message ?? String(e);
    }
  }

  return NextResponse.json({
    sessionInfo,
    dbWrite,
    dbError,
    reviews,
    readError,
  });
}
