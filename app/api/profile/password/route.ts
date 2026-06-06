import { auth } from "@/auth";
import sql from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { compareSync, hashSync } from "bcryptjs";

export const runtime = "nodejs";

type DbUser = { id: string; password_hash: string };

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword)
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  try {
    const users = await sql.query("SELECT id, password_hash FROM users WHERE id = $1::uuid", [userId]) as DbUser[];
    if (users.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const user = users[0];

    const isValid = compareSync(currentPassword, user.password_hash);
    if (!isValid) return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });

    const newHash = hashSync(newPassword, 10);
    await sql.query("UPDATE users SET password_hash = $1 WHERE id = $2::uuid", [newHash, userId]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Update failed" }, { status: 500 });
  }
}