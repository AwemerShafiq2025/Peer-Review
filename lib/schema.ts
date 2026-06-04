import { sql } from "@/lib/db";

export async function createTables() {
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id uuid DEFAULT gen_random_uuid(),
      email text UNIQUE NOT NULL,
      name text NOT NULL,
      password_hash text NOT NULL,
      created_at timestamptz DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id uuid DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      paper_title text,
      quartile text,
      verdict text,
      avg_score numeric,
      full_result jsonb,
      created_at timestamptz DEFAULT now()
    )
  `;
}
