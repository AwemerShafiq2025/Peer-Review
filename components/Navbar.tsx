import Link from "next/link";
import { auth, signOut } from "@/auth";
import ClientNavToggle from "./ClientNavToggle";
import { IconGavel } from "./icons";

const navLinks = [
  { href: "/#how", label: "How it works" },
  { href: "/#panel", label: "The Panel" },
  { href: "/#submit", label: "Submit" },
];

function NavLinks({ mobile = false }: { mobile?: boolean }) {
  return (
    <>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={
            mobile
              ? "block rounded-md px-3 py-2 text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
              : "transition-colors hover:text-text-primary"
          }
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}

function AuthLinks({
  userLabel,
  mobile = false,
}: {
  userLabel?: string | null;
  mobile?: boolean;
}) {
  if (userLabel) {
    return (
      <div className={mobile ? "mt-3 space-y-3 border-t border-subtle pt-3" : "flex items-center gap-3"}>
        <span className={mobile ? "block px-3 text-sm text-text-secondary" : "max-w-44 truncate text-sm text-text-secondary"}>
          {userLabel}
        </span>
        <Link href="/history" className={mobile ? "btn-outline w-full !px-4 !py-2 text-sm" : "btn-outline !px-4 !py-2 text-sm"}>
          History
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" className={mobile ? "btn-outline w-full !px-4 !py-2 text-sm" : "btn-outline !px-4 !py-2 text-sm"}>
            Sign Out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={mobile ? "mt-3 grid gap-2 border-t border-subtle pt-3" : "flex items-center gap-3"}>
      <Link href="/login" className={mobile ? "btn-outline w-full !px-4 !py-2 text-sm" : "btn-outline !px-4 !py-2 text-sm"}>
        Sign In
      </Link>
      <Link href="/register" className={mobile ? "btn-primary w-full !px-4 !py-2 text-sm" : "btn-primary !px-4 !py-2 text-sm"}>
        Sign Up
      </Link>
    </div>
  );
}

export default async function Navbar() {
  const session = await auth();
  const userLabel = session?.user?.name || session?.user?.email;

  return (
    <header className="glass-nav sticky top-0 z-50">
      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-accent/15 text-accent ring-1 ring-accent/30">
            <IconGavel width={18} height={18} />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Peer<span className="text-accent">Reviewer</span>
          </span>
        </Link>
        <div className="hidden items-center gap-8 text-sm text-text-secondary md:flex">
          <NavLinks />
        </div>
        <div className="hidden md:block">
          <AuthLinks userLabel={userLabel} />
        </div>
        <ClientNavToggle>
          <div className="space-y-1 text-sm">
            <NavLinks mobile />
            <AuthLinks userLabel={userLabel} mobile />
          </div>
        </ClientNavToggle>
      </nav>
    </header>
  );
}
