"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
  leaving: boolean;
}

interface ToastContextValue {
  show(message: string, type?: ToastType, action?: ToastAction): void;
}

const ToastContext = createContext<ToastContextValue>({
  show: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, type: ToastType = "info", action?: ToastAction) => {
    const id = String(Date.now());
    setToasts((prev) => [...prev, { id, message, type, action, leaving: false }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300);
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={{
        position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
        zIndex: 10000, display: "flex", flexDirection: "column", gap: 8, alignItems: "center",
        pointerEvents: "none",
      }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 16px", borderRadius: 8,
              fontSize: 14, fontWeight: 500,
              color: "#fff",
              background: t.type === "success" ? "#16a34a" : t.type === "error" ? "#dc2626" : "#2f6feb",
              boxShadow: "0 4px 16px rgba(0,0,0,.15)",
              animation: t.leaving ? "toastOut .3s ease forwards" : "toastIn .3s ease",
              pointerEvents: "auto",
              whiteSpace: "nowrap",
            }}
          >
            <span>{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}</span>
            <span>{t.message}</span>
            {t.action && (
              <button
                onClick={() => {
                  t.action!.onClick();
                  setToasts((prev) => prev.filter((x) => x.id !== t.id));
                }}
                style={{
                  background: "rgba(255,255,255,.2)", border: "none", color: "#fff",
                  padding: "4px 10px", borderRadius: 4, cursor: "pointer",
                  fontSize: 13, fontWeight: 600,
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastOut { from { opacity:1; transform:translateY(0); } to { opacity:0; transform:translateY(-8px); } }
      `}</style>
    </ToastContext.Provider>
  );
}
