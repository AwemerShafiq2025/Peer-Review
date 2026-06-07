import { NextResponse } from "next/server";
import sql from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await sql.query(
      "SELECT COUNT(*)::int AS total FROM reviews"
    ) as { total: number }[];
    const total = result[0]?.total ?? 0;
    return NextResponse.json({ total });
  } catch {
    return NextResponse.json({ total: 0 });
  }
}