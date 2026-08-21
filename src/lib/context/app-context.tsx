"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import type { Task, Version, Notification as NotifType } from "@/lib/types";
import { fetchVersions, fetchTasks } from "@/api";
import { filterTasksByRole, isOverdue } from "@/utils";
import { useToast } from "@/lib/toast-context";
import { useUI } from "./ui-context";

export interface User {
  id: number;
  name: string;
  avatar: string;
  role: string;
}

interface AppContextValue {
  // auth
  currentUser: string | null;
  currentUserRole: string | null;
  authChecked: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;

  // data
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  versions: Version[];
  setVersions: (versions: Version[]) => void;
  activeVersionId: number | null;
  setActiveVersionId: (id: number | null) => void;
  members: string[];
  setMembers: (members: string[]) => void;
  users: User[];
  setUsers: (users: User[]) => void;
  refreshUsers: () => Promise<void>;
  notifications: NotifType[];
  setNotifications: (notifs: NotifType[]) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

interface AppProviderProps {
  children: ReactNode;
  initialTasks: Task[];
  initialUsers: User[];
  initialVersions: Version[];
  initialMembers: string[];
}

export function AppProvider({ children, initialTasks, initialUsers, initialVersions, initialMembers }: AppProviderProps) {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [versions, setVersions] = useState<Version[]>(initialVersions);
  const [activeVersionId, setActiveVersionId] = useState<number | null>(null);
  const [members, setMembers] = useState<string[]>(initialMembers);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [notifications, setNotifications] = useState<NotifType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const toast = useToast();
  const { isModalOpen, setShowNotifications } = useUI();

  // Resolve current session via cookie on mount (layout guard already confirmed a session exists).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.name);
          setCurrentUserRole(data.role);
        }
      } catch {
        /* network error; treat as not logged in */
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Compute effective tasks based on current user's role (mirrors App.tsx)
  const effectiveTasks = useMemo(() => {
    if (!currentUser || !currentUserRole) return tasks;
    return filterTasksByRole(tasks, currentUser, currentUserRole);
  }, [tasks, currentUser, currentUserRole]);

  // Check for overdue tasks on load and create notifications (migrated from App.tsx)
  useEffect(() => {
    if (!currentUser) return;
    const overdues = effectiveTasks.filter((t) => isOverdue(t));
    if (overdues.length > 0 && effectiveTasks.length > 0) {
      toast.show(`共有 ${overdues.length} 个任务已逾期`, "warning", {
        label: "查看",
        onClick: () => setShowNotifications(true),
      });
    }
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    for (const t of effectiveTasks) {
      if (!t.due || !t.assignees.length) continue;
      const dueDate = new Date(t.due);
      for (const a of t.assignees) {
        if (dueDate < now) {
          fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userName: a, type: "overdue", text: `任务「${t.title}」已逾期`, taskId: t.id }),
          }).catch(() => {});
        } else if (dueDate <= tomorrow) {
          fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userName: a, type: "due_soon", text: `任务「${t.title}」将在24小时内到期`, taskId: t.id }),
          }).catch(() => {});
        }
      }
    }
  }, [effectiveTasks.length, currentUser]);

  // Fetch notifications + 30s polling (migrated from App.tsx)
  useEffect(() => {
    if (!currentUser) return;
    const controller = new AbortController();
    const fetchNotifs = async () => {
      try {
        const [listRes, countRes] = await Promise.all([
          fetch(`/api/notifications?user=${encodeURIComponent(currentUser)}`, { signal: controller.signal }),
          fetch(`/api/notifications?user=${encodeURIComponent(currentUser)}&unread=1`, { signal: controller.signal }),
        ]);
        if (listRes.ok) {
          setNotifications(await listRes.json());
        }
        if (countRes.ok) {
          const { count } = await countRes.json();
          setUnreadCount(count);
        }
      } catch { /* ignore poll errors */ }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => { clearInterval(interval); controller.abort(); };
  }, [currentUser]);

  // Fetch versions and members on mount (migrated from App.tsx)
  useEffect(() => {
    fetchVersions().then(setVersions).catch((err) => { console.error("Failed to fetch versions:", err); });
  }, []);

  useEffect(() => {
    fetch("/api/users/members").then((r) => r.json()).then(setMembers).catch(() => {});
  }, []);

  // 30s task polling, paused while tab hidden or task modal open (migrated from KanbanBoard.tsx)
  const isModalOpenRef = useRef(false);
  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  useEffect(() => {
    if (!currentUser) return;
    let interval: ReturnType<typeof setInterval> | null = null;
    const startPolling = () => {
      if (interval) return;
      interval = setInterval(async () => {
        if (document.hidden) return;
        if (isModalOpenRef.current) return;
        try {
          const fresh = await fetchTasks();
          if (Array.isArray(fresh)) {
            setTasks(fresh);
          }
        } catch (e) {
          console.warn("Polling refresh failed:", e);
        }
      }, 30_000);
    };
    const handleVisibility = () => {
      if (document.hidden) {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      } else {
        startPolling();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    startPolling();
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (interval) clearInterval(interval);
    };
  }, [currentUser]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch { /* ignore */ }
    setCurrentUser(null);
    setCurrentUserRole(null);
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) { console.error("Failed to refresh users:", err); }
  }, []);

  const isAdmin = currentUserRole === "admin";

  const value = useMemo<AppContextValue>(
    () => ({
      currentUser, currentUserRole, authChecked, isAdmin, logout,
      tasks, setTasks, versions, setVersions, activeVersionId, setActiveVersionId,
      members, setMembers, users, setUsers, refreshUsers,
      notifications, setNotifications, unreadCount, setUnreadCount,
    }),
    [currentUser, currentUserRole, authChecked, isAdmin, logout,
     tasks, versions, activeVersionId, members, users, refreshUsers,
     notifications, unreadCount]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}