"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import type { Task } from "@/lib/types";

interface UIContextValue {
  // task modal
  modalTask: Task | null;
  modalReadOnly: boolean;
  openTask: (task: Task, readOnly: boolean) => void;
  closeTask: () => void;
  isModalOpen: boolean;

  // overlays
  showMyTasks: boolean;
  setShowMyTasks: (v: boolean) => void;
  showUserManagement: boolean;
  setShowUserManagement: (v: boolean) => void;
  showNotifications: boolean;
  setShowNotifications: (v: boolean) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIContextProvider");
  return ctx;
}

export function UIContextProvider({ children }: { children: ReactNode }) {
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [modalReadOnly, setModalReadOnly] = useState(false);
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const openTask = useCallback((task: Task, readOnly: boolean) => {
    setModalTask(task);
    setModalReadOnly(readOnly);
  }, []);

  const closeTask = useCallback(() => {
    setModalTask(null);
    setModalReadOnly(false);
  }, []);

  const value = useMemo<UIContextValue>(
    () => ({
      modalTask, modalReadOnly, openTask, closeTask, isModalOpen: modalTask !== null,
      showMyTasks, setShowMyTasks, showUserManagement, setShowUserManagement, showNotifications, setShowNotifications,
    }),
    [modalTask, modalReadOnly, openTask, closeTask, showMyTasks, showUserManagement, showNotifications]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}