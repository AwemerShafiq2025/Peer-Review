"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { IconGavel, Spinner } from "@/components/icons";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        redirectTo: "/",
      });

      if (!result?.ok) {
        setError("Invalid email or password");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card p-4 sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-text-secondary">Continue to your peer review workspace.</p>
      </div>

      {registered && (
        <p className="mb-4 rounded-md bg-accent/10 p-3 text-sm text-accent ring-1 ring-accent/25">
          Account created! Please sign in.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-text-secondary">Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            className="w-full rounded-md border border-subtle bg-base/60 px-4 py-3 text-base text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-accent/60"
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
            autoComplete="current-password"
            className="w-full rounded-md border border-subtle bg-base/60 px-4 py-3 text-base text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-accent/60"
            placeholder="Your password"
            required
          />
        </label>

        {error && (
          <p className="rounded-md bg-rose-500/10 p-3 text-sm text-rose-300 ring-1 ring-rose-400/20">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary min-h-[48px] w-full">
          {loading ? (
            <>
              <Spinner width={18} height={18} /> Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-accent transition-colors hover:text-accent-glow">
          Sign up
        </Link>
      </p>
    </section>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-base px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md flex-col justify-center">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-accent/15 text-accent ring-1 ring-accent/30">
            <IconGavel width={19} height={19} />
          </span>
          <span className="text-xl font-bold tracking-tight">
            Peer<span className="text-accent">Reviewer</span>
          </span>
        </Link>

        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
