"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { IconGavel } from "@/components/icons";
import Navbar from "@/components/Navbar";

export default function SettingsPage() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDeleteAccount() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Could not delete account.");
        return;
      }
      await signOut({ redirect: false });
      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-base">
      <Navbar />
      <section className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="mt-2 text-text-secondary">Manage your PeerReviewer account.</p>

        {/* Danger Zone */}
        <div className="mt-10 rounded-xl border border-rose-400/20 bg-rose-500/5 p-6">
          <h2 className="font-semibold text-rose-300">Danger Zone</h2>
          <p className="mt-1.5 text-sm text-text-secondary">
            Permanently delete your account and all your review history. This action cannot be undone.
          </p>

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="mt-4 rounded-full border border-rose-400/30 px-5 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10"
            >
              Delete My Account
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-semibold text-rose-300">
                Are you sure? All your data will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
                >
                  {loading ? "Deleting…" : "Yes, Delete My Account"}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={loading}
                  className="rounded-full border border-subtle px-5 py-2 text-sm font-semibold text-text-secondary transition hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
              {error && (
                <p className="text-sm text-rose-300">{error}</p>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}