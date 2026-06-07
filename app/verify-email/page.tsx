import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-base">
      <Navbar />
      <section className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
        <div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-accent/15 text-accent text-3xl">
          ✉️
        </div>
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="mt-3 text-text-secondary">
          We sent a verification link to your email address. Click the link to
          activate your account.
        </p>
        <p className="mt-2 text-sm text-text-tertiary">
          Didn&apos;t receive it? Check your spam folder.
        </p>
        <Link href="/login" className="btn-outline mt-8 !px-6 !py-2.5 text-sm">
          Back to Sign In
        </Link>
      </section>
    </main>
  );
}