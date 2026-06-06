import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const userId = (session?.user as any)?.id;

  if (!session?.user || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Review ID required" }, { status: 400 });
  }

  try {
    const result = await sql`
      DELETE FROM reviews
      WHERE id = ${id}::uuid
      AND user_id = ${userId}::uuid
      RETURNING id
    ` as any[];

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Review not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, deleted: id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Delete failed" },
      { status: 500 }
    );
  }
}

// ── PATCH: Update paper title ─────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const userId = (session?.user as any)?.id;

  if (!session?.user || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Review ID required" }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = String(body?.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    const result = await sql`
      UPDATE reviews
      SET paper_title = ${title}
      WHERE id = ${id}::uuid
      AND user_id = ${userId}::uuid
      RETURNING id
    ` as any[];

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Review not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, updated: id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Update failed" },
      { status: 500 }
    );
  }
}
