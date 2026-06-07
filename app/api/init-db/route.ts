import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createTables } from "@/lib/schema";
import sql from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const initSecret = process.env.INIT_DB_SECRET;
  const requestSecret = request.headers.get("x-init-secret");

  if (!initSecret || requestSecret !== initSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await createTables();

  // ── Add email verification columns for existing users ──
  await sql.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS verification_token TEXT
  `);

  return NextResponse.json({ ok: true });
}