import Link from "next/link";
import { IconGavel } from "./icons";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-subtle bg-surface/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-accent/15 text-accent ring-1 ring-accent/30">
              <IconGavel width={18} height={18} />
            </span>
            <span className="text-lg font-bold tracking-tight">
              Peer<span className="text-accent">Reviewer</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-text-secondary">
            AI-powered peer review for researchers worldwide
          </p>
          <p className="mt-3 text-sm font-medium text-text-primary">
            Powered by Albatross Technologies
          </p>
        </div>

        <div className="border-t border-subtle pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <h2 className="text-sm font-semibold text-text-primary">Product</h2>
          <nav className="mt-4 grid gap-3 text-sm text-text-secondary">
            <Link href="/#how" className="transition-colors hover:text-text-primary">
              How it works
            </Link>
            <Link href="/#panel" className="transition-colors hover:text-text-primary">
              The Panel
            </Link>
            <Link href="/#submit" className="transition-colors hover:text-text-primary">
              Submit Paper
            </Link>
            <Link href="/history" className="transition-colors hover:text-text-primary">
              Review History
            </Link>
          </nav>
        </div>

        <div className="border-t border-subtle pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <h2 className="text-sm font-semibold text-text-primary">Info</h2>
          <nav className="mt-4 grid gap-3 text-sm text-text-secondary">
            <Link href="/about" className="transition-colors hover:text-text-primary">
              About
            </Link>
            <Link href="/terms" className="transition-colors hover:text-text-primary">
              Terms & Privacy
            </Link>
            <a
              href="https://build.nvidia.com"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-text-primary"
            >
              NVIDIA NIM
            </a>
          </nav>
        </div>
      </div>

      <div className="border-t border-subtle">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-5 text-xs text-text-tertiary sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Albatross Technologies. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-text-secondary transition-colors">
              Terms & Privacy
            </Link>
            <p>Reviews are AI-generated for guidance only.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}