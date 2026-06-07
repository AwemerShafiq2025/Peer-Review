import { auth } from "@/auth";
import sql from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function DELETE() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!session?.user || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await sql.query(
      "DELETE FROM users WHERE id = $1::uuid",
      [userId]
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Account deletion failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Could not delete account." },
      { status: 500 }
    );
  }
}