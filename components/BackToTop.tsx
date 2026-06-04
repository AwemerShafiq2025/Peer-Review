"use client";

import { useEffect, useState } from "react";
import { IconArrow } from "./icons";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="btn-outline fixed bottom-8 right-8 z-50 !h-11 !w-11 !rounded-md !p-0 shadow-card"
    >
      <IconArrow width={18} height={18} className="-rotate-90" />
    </button>
  );
}
