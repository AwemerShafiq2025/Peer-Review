"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { IconGavel, Spinner } from "@/components/icons";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Could not create account." }));
        setError(data.error ?? "Could not create account.");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Could not create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-base px-6 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md flex-col justify-center">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-accent/15 text-accent ring-1 ring-accent/30">
            <IconGavel width={19} height={19} />
          </span>
          <span className="text-xl font-bold tracking-tight">
            Peer<span className="text-accent">Reviewer</span>
          </span>
        </Link>

        <section className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="mt-2 text-sm text-text-secondary">Save reviews and return to your paper history.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-text-secondary">Full Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                className="w-full rounded-md border border-subtle bg-base/60 px-4 py-3 text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-accent/60"
                placeholder="Ada Lovelace"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-text-secondary">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                className="w-full rounded-md border border-subtle bg-base/60 px-4 py-3 text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-accent/60"
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-text-secondary">Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="new-password"
                minLength={8}
                className="w-full rounded-md border border-subtle bg-base/60 px-4 py-3 text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-accent/60"
                placeholder="At least 8 characters"
                required
              />
            </label>

            {error && (
              <p className="rounded-md bg-rose-500/10 p-3 text-sm text-rose-300 ring-1 ring-rose-400/20">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <Spinner width={18} height={18} /> Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-accent transition-colors hover:text-accent-glow">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
