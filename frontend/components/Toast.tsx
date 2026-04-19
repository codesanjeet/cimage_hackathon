"use client";
// components/Toast.tsx
// Custom toast notification — no external library.
// Usage: import { useToast, ToastContainer } from "@/components/Toast"
//   const { showToast } = useToast();
//   showToast("Visitor approved", "success");

import React, { createContext, useContext, useState, useCallback } from "react";
import { RiCheckboxCircleLine, RiErrorWarningLine, RiInformationLine, RiCloseLine } from "react-icons/ri";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let _counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++_counter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const iconMap = {
    success: <RiCheckboxCircleLine className="text-emerald-400 text-xl flex-shrink-0" />,
    error: <RiErrorWarningLine className="text-red-400 text-xl flex-shrink-0" />,
    info: <RiInformationLine className="text-indigo-400 text-xl flex-shrink-0" />,
  };

  const borderMap = {
    success: "border-emerald-500/40",
    error: "border-red-500/40",
    info: "border-indigo-500/40",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container — fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-start gap-3 px-4 py-3 rounded-xl border
              bg-[#1a1d27]/95 backdrop-blur-sm shadow-2xl
              ${borderMap[toast.type]}
              animate-slide-in pointer-events-auto
            `}
            style={{ animation: "slideInRight 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
          >
            {iconMap[toast.type]}
            <span className="text-sm text-gray-200 leading-relaxed flex-1">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-gray-500 hover:text-gray-300 transition-colors ml-1 flex-shrink-0"
            >
              <RiCloseLine />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%) scale(0.9); }
          to   { opacity: 1; transform: translateX(0)    scale(1);   }
        }
      `}</style>
    </ToastContext.Provider>
  );
}