import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=invalid-token", req.url)
    );
  }

  try {
    const users = await sql.query(
      `SELECT id FROM users 
       WHERE verification_token = $1 
       AND email_verified = FALSE`,
      [token]
    ) as { id: string }[];

    if (!users[0]) {
      return NextResponse.redirect(
        new URL("/login?error=invalid-token", req.url)
      );
    }

    await sql.query(
      `UPDATE users 
       SET email_verified = TRUE, verification_token = NULL 
       WHERE id = $1`,
      [users[0].id]
    );

    return NextResponse.redirect(
      new URL("/login?verified=true", req.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=server-error", req.url)
    );
  }
}