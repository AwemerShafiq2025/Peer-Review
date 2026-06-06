import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#000000] px-6 text-center">
      <p className="text-8xl font-bold tracking-tight text-[#4D9BFF] sm:text-9xl">404</p>
      <h1 className="mt-6 text-2xl font-bold text-white sm:text-3xl">Page not found</h1>
      <p className="mt-3 max-w-md text-[#B4B4BE]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="rounded-full bg-[#4D9BFF] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4D9BFF]/80"
        >
          Go Home
        </Link>
        <Link
          href="/history"
          className="rounded-full border border-white/10 px-6 py-2.5 text-sm font-semibold text-[#B4B4BE] transition hover:border-white/25 hover:text-white"
        >
          View History
        </Link>
      </div>
    </main>
  );
}