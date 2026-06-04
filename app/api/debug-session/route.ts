import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const initSecret = process.env.INIT_DB_SECRET;
  const requestSecret = request.headers.get("x-init-secret");

  if (!initSecret || requestSecret !== initSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await auth();

  return NextResponse.json({
    ok: true,
    hasSession: !!session,
    hasUser: !!session?.user,
    hasUserId: !!(session?.user as { id?: string } | undefined)?.id,
    session,
  });
}
