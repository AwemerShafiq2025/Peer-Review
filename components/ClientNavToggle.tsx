"use client";

import { ReactNode, useState } from "react";

export default function ClientNavToggle({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Toggle navigation"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-subtle bg-white/5 text-text-primary transition-colors hover:bg-white/10"
      >
        <span className="flex flex-col gap-1.5">
          <span className="block h-0.5 w-5 rounded-pill bg-current" />
          <span className="block h-0.5 w-5 rounded-pill bg-current" />
          <span className="block h-0.5 w-5 rounded-pill bg-current" />
        </span>
      </button>

      {open && (
        <div className="absolute left-4 right-4 top-full mt-2 rounded-lg border border-subtle bg-elevated p-4 shadow-card">
          {children}
        </div>
      )}
    </div>
  );
}
