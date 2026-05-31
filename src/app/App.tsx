"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import type { Task, Version, Notification as NotifType } from "@/lib/types";
import { ToastProvider, useToast } from "@/lib/toast-context";
import TopNav from "@/components/TopNav/TopNav";
import KanbanBoard from "@/components/KanbanBoard";
import VersionPage from "@/components/VersionPage";
import LoginPage from "@/components/LoginPage";
import NotificationPanel from "@/components/NotificationPanel/NotificationPanel";
import { createTask, updateTask, deleteTask, fetchVersions, getUserHeader } from "@/api";
import { isOverdue, filterTasksByRole, canSeeJiafangSource } from "@/utils";

const Dashboard = dynamic(() => import("@/components/Dashboard"), { ssr: false });
const Report = dynamic(() => import("@/components/Report"), { ssr: false });
const MyTasks = dynamic(() => import("@/components/MyTasks"), { ssr: false });
const TaskModal = dynamic(() => import("@/components/TaskModal/TaskModal"), { ssr: false });
const UserManagement = dynamic(() => import("@/components/UserManagement"), { ssr: false });

// Request notification permission on mount
function useNotifications() {
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);
}

function notify(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
}

interface User {
  id: number;
  name: string;
  avatar: string;
  role: string;
}

interface AppProps {
  initialTasks: Task[];
  initialUsers: User[];
}

function AppInner({ initialTasks, initialUsers }: AppProps) {
  const [view, setView] = useState<"kanban" | "dashboard" | "report" | "versions">("kanban");
  const [versions, setVersions] = useState<Version[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<number | null>(null);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [modalReadOnly, setModalReadOnly] = useState(false);
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotifType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [members, setMembers] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("currentUser");
    }
    return null;
  });

  const currentUserRole = useMemo(() => {
    if (!currentUser) return null;
    return users.find((u) => u.name === currentUser)?.role ?? null;
  }, [currentUser, users]);

  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // Compute effective tasks based on current user's role
  const effectiveTasks = useMemo(() => {
    if (!currentUser || !currentUserRole) return tasks;
    return filterTasksByRole(tasks, currentUser, currentUserRole);
  }, [tasks, currentUser, currentUserRole]);

  const toast = useToast();
  useNotifications();

  // Check for overdue tasks on load and create notifications
  useEffect(() => {
    if (!currentUser) return;
    const overdues = effectiveTasks.filter((t) => isOverdue(t));
    if (overdues.length > 0 && effectiveTasks.length > 0) {
      notify("任务逾期提醒", `共有 ${overdues.length} 个任务已逾期`);
    }
    // Create overdue/due_soon notifications
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    for (const t of effectiveTasks) {
      if (!t.due || !t.assignees.length) continue;
      const dueDate = new Date(t.due);
      for (const a of t.assignees) {
        if (dueDate < now) {
          fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getUserHeader() },
            body: JSON.stringify({ userName: a, type: "overdue", text: `任务「${t.title}」已逾期`, taskId: t.id }),
          }).catch(() => {});
        } else if (dueDate <= tomorrow) {
          fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getUserHeader() },
            body: JSON.stringify({ userName: a, type: "due_soon", text: `任务「${t.title}」将在24小时内到期`, taskId: t.id }),
          }).catch(() => {});
        }
      }
    }
  }, [effectiveTasks.length, currentUser]);

  // Fetch notifications + 30s polling
  useEffect(() => {
    if (!currentUser) return;
    const controller = new AbortController();
    const fetchNotifs = async () => {
      try {
        const [listRes, countRes] = await Promise.all([
          fetch(`/api/notifications?user=${encodeURIComponent(currentUser)}`, { headers: getUserHeader(), signal: controller.signal }),
          fetch(`/api/notifications?user=${encodeURIComponent(currentUser)}&unread=1`, { headers: getUserHeader(), signal: controller.signal }),
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

  useEffect(() => {
    fetchVersions().then(setVersions).catch((err) => { console.error("Failed to fetch versions:", err); });
  }, []);

  useEffect(() => {
    fetch("/api/users/members").then((r) => r.json()).then(setMembers).catch(() => {});
  }, []);

  const activeVersion = useMemo(() => versions.find((v) => v.id === activeVersionId), [versions, activeVersionId]);
  const isReadonly = activeVersion?.status === "closed";
  const isAdmin = useMemo(() => users.find((u) => u.name === currentUser)?.role === "admin", [users, currentUser]);

  const handleLogin = useCallback((user: string) => {
    setCurrentUser(user);
    localStorage.setItem("currentUser", user);
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    setShowUserManagement(false);
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) { console.error("Failed to refresh users:", err); }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (modalTask !== null) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setModalTask({ status: "todo" } as Task);
      }
      if (e.key === "/") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modalTask]);

  const handleSaveTask = useCallback(
    async (saved: Omit<Task, "id" | "created" | "updated" | "subtasks" | "comments">) => {
      try {
        const oldAssignees = modalTask?.assignees || [];
        const newAssignees = saved.assignees || [];
        const addedAssignees = newAssignees.filter((a) => !oldAssignees.includes(a));

        if (modalTask?.id) {
          const updated = await updateTask(modalTask.id, saved);
          const newTasks = tasks.map((t) => (t.id === updated.id ? updated : t));
          setTasks(newTasks);

          // Notify new assignees
          for (const assignee of addedAssignees) {
            if (assignee !== currentUser) {
              try {
                await fetch("/api/notifications", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...getUserHeader() },
                  body: JSON.stringify({
                    userName: assignee,
                    type: "assigned",
                    text: `${currentUser} 将任务「${saved.title}」分配给你`,
                    taskId: modalTask.id,
                  }),
                });
              } catch { /* ignore notification errors */ }
            }
          }
        } else {
          const created = await createTask(saved);
          setTasks([...tasks, created]);

          // Notify initial assignees
          for (const assignee of addedAssignees) {
            if (assignee !== currentUser) {
              try {
                await fetch("/api/notifications", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...getUserHeader() },
                  body: JSON.stringify({
                    userName: assignee,
                    type: "assigned",
                    text: `${currentUser} 将任务「${saved.title}」分配给你`,
                    taskId: created.id,
                  }),
                });
              } catch { /* ignore */ }
            }
          }
        }
        toast.show("保存成功", "success");
      } catch (err) {
        console.error("Failed to save task:", err);
        toast.show("保存失败，请重试", "error");
      }
      setModalTask(null);
      setModalReadOnly(false);
    },
    [modalTask, tasks, toast, currentUser],
  );

  const handleDeleteTask = useCallback(
    async (id: number) => {
      try {
        await deleteTask(id);
        setTasks((prev) => prev.filter((t) => t.id !== id));
        toast.show("已删除", "success");
      } catch (err) {
        console.error("Failed to delete task:", err);
        toast.show("删除失败，请重试", "error");
      }
      setModalTask(null);
      setModalReadOnly(false);
    },
    [toast],
  );

  const handleViewTask = useCallback((task: Task) => {
    setModalTask(task);
    setModalReadOnly(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setModalTask(task);
    setModalReadOnly(false);
  }, []);

  const handleMarkNotifRead = useCallback(async (id: number) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/notifications?id=${id}&user=${encodeURIComponent(currentUser)}`, { method: "PATCH", headers: getUserHeader() });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* ignore */ }
  }, [currentUser]);

  const handleMarkAllNotifRead = useCallback(async () => {
    if (!currentUser) return;
    try {
      await fetch(`/api/notifications?user=${encodeURIComponent(currentUser)}`, { method: "PATCH", headers: getUserHeader() });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  }, [currentUser]);

  const handleClickNotif = useCallback((notif: NotifType) => {
    if (notif.taskId) {
      const task = tasks.find((t) => t.id === notif.taskId);
      if (task) {
        setModalTask(task);
        setModalReadOnly(true);
      }
    }
    setShowNotifications(false);
  }, [tasks]);

  // Show login page if not logged in
  if (!currentUser) {
    return <LoginPage users={users} onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <TopNav
        view={view}
        onViewChange={setView}
        currentUser={currentUser}
        onAvatarClick={() => setShowMyTasks(!showMyTasks)}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        onUserManagement={() => setShowUserManagement(true)}
        unreadCount={unreadCount}
        onBellClick={() => { setShowNotifications(!showNotifications); setShowMyTasks(false); }}
      />
      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          onMarkAllRead={handleMarkAllNotifRead}
          onMarkRead={handleMarkNotifRead}
          onClickNotif={handleClickNotif}
          onClose={() => setShowNotifications(false)}
        />
      )}
      {showMyTasks && (
        <MyTasks tasks={effectiveTasks} currentUser={currentUser} onClose={() => setShowMyTasks(false)} onSelectTask={(t) => { setModalTask(t); setModalReadOnly(true); setShowMyTasks(false); }} onTasksChange={setTasks} />
      )}
      {showUserManagement && isAdmin && (
        <UserManagement users={users} onClose={() => setShowUserManagement(false)} onUserChange={refreshUsers} />
      )}
      {view === "kanban" && (
        <div key="kanban" className="view-enter">
          <KanbanBoard initialTasks={effectiveTasks} onEditTask={handleEditTask} onViewTask={handleViewTask} onTasksChange={setTasks} versions={versions} activeVersionId={activeVersionId} onVersionChange={setActiveVersionId} readonly={isReadonly} currentUser={currentUser} showJiafangFilter={currentUserRole ? canSeeJiafangSource(currentUserRole) : true} modalTask={modalTask} />
        </div>
      )}
      {view === "dashboard" && (
        <div key="dashboard" className="view-enter">
          <Dashboard tasks={effectiveTasks} members={members} />
        </div>
      )}
      {view === "report" && (
        <div key="report" className="view-enter">
          <Report tasks={effectiveTasks} />
        </div>
      )}
      {view === "versions" && (
        <div key="versions" className="view-enter">
          <VersionPage versions={versions} onVersionsChange={(v) => setVersions(v)} />
        </div>
      )}
      {modalTask !== null && (
        <TaskModal task={modalTask} onSave={handleSaveTask} onDelete={handleDeleteTask} onClose={() => setModalTask(null)} readOnly={modalReadOnly} versions={versions} defaultVersionId={activeVersionId} currentUser={currentUser} members={members} />
      )}
    </div>
  );
}

export default function App({ initialTasks, initialUsers }: AppProps) {
  return (
    <ToastProvider>
      <AppInner initialTasks={initialTasks} initialUsers={initialUsers} />
    </ToastProvider>
  );
}
