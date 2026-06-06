"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteReviewButton({
  reviewId,
}: {
  reviewId: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error ?? "Delete failed");
      }
    } catch {
      alert("Delete failed. Please try again.");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="text-red-500 hover:text-red-700 text-sm font-medium mr-4">
      {loading ? "Deleting..." : confirming ? "Confirm?" : "Delete"}
    </button>
  );
}
