"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function DeleteAccountButton() {
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

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="mt-4 rounded-full border border-rose-400/30 px-5 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10"
      >
        Delete My Account
      </button>
    );
  }

  return (
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
      {error && <p className="text-sm text-rose-300">{error}</p>}
    </div>
  );
}