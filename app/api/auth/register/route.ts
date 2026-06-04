import { NextResponse } from "next/server";
import { hashSync } from "bcryptjs";
import sql from "@/lib/db";

type RegisterBody = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: RegisterBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  try {
    const existing = (await sql.query("SELECT id FROM users WHERE email = $1", [email])) as { id: string }[];

    if (existing.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = hashSync(password, 12);

    await sql.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)",
      [name, email, passwordHash]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Registration failed:", error);

    return NextResponse.json({ error: "Could not create account. Please try again." }, { status: 500 });
  }
}
