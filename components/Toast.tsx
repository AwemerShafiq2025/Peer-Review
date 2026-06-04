"use client";

import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";
type ToastMessage = {
  id: number;
  message: string;
  type: ToastType;
};

const TOAST_EVENT = "peerreviewer:toast";

const STYLE: Record<ToastType, string> = {
  success: "border-emerald-400/25 bg-emerald-500/15 text-emerald-200",
  error: "border-rose-400/25 bg-rose-500/15 text-rose-200",
  info: "border-accent/25 bg-accent/15 text-accent",
};

export function useToast() {
  return {
    showToast(message: string, type: ToastType = "info") {
      if (typeof window === "undefined") return;

      window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, type } }));
    },
  };
}

export function ToastViewport() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    function onToast(event: Event) {
      const detail = (event as CustomEvent<{ message: string; type: ToastType }>).detail;
      const id = Date.now() + Math.random();

      setToasts((current) => [...current, { id, message: detail.message, type: detail.type }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 4000);
    }

    window.addEventListener(TOAST_EVENT, onToast);

    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  return (
    <div className="fixed right-6 top-6 z-50 grid w-[min(22rem,calc(100vw-3rem))] gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-[toastSlide_220ms_ease-out] rounded-md border px-4 py-3 text-sm shadow-card backdrop-blur ${STYLE[toast.type]}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
