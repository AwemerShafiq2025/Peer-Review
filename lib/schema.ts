import { sql } from "@/lib/db";

export async function createTables() {
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE NOT NULL,
      name text NOT NULL,
      password_hash text NOT NULL,
      created_at timestamptz DEFAULT now()
    )
  `;

  await sql`UPDATE users SET id = gen_random_uuid() WHERE id IS NULL`;
  await sql`ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid()`;
  await sql`ALTER TABLE users ALTER COLUMN id SET NOT NULL`;
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_pkey'
          AND conrelid = 'users'::regclass
      ) THEN
        ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
      END IF;
    END $$;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid,
      paper_title text,
      quartile text,
      verdict text,
      avg_score numeric,
      full_result jsonb,
      created_at timestamptz DEFAULT now()
    )
  `;

  await sql`UPDATE reviews SET id = gen_random_uuid() WHERE id IS NULL`;
  await sql`ALTER TABLE reviews ALTER COLUMN id SET DEFAULT gen_random_uuid()`;
  await sql`ALTER TABLE reviews ALTER COLUMN id SET NOT NULL`;
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'reviews_pkey'
          AND conrelid = 'reviews'::regclass
      ) THEN
        ALTER TABLE reviews ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'reviews_user_id_fkey'
          AND conrelid = 'reviews'::regclass
      ) THEN
        ALTER TABLE reviews
          ADD CONSTRAINT reviews_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END $$;
  `;
}
