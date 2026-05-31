"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import type { Task, Version } from "@/lib/types";
import { ToastProvider, useToast } from "@/lib/toast-context";
import TopNav from "@/components/TopNav/TopNav";
import KanbanBoard from "@/components/KanbanBoard";
import VersionPage from "@/components/VersionPage";
import LoginPage from "@/components/LoginPage";
import { createTask, updateTask, deleteTask, fetchVersions } from "@/api";
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

  // Check for overdue tasks on load and notify
  useEffect(() => {
    const overdues = effectiveTasks.filter((t) => isOverdue(t));
    if (overdues.length > 0 && effectiveTasks.length > 0) {
      notify("任务逾期提醒", `共有 ${overdues.length} 个任务已逾期`);
    }
  }, [effectiveTasks.length]);

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
        if (modalTask?.id) {
          const updated = await updateTask(modalTask.id, saved);
          const newTasks = tasks.map((t) => (t.id === updated.id ? updated : t));
          setTasks(newTasks);
        } else {
          const created = await createTask(saved);
          setTasks([...tasks, created]);
        }
        toast.show("保存成功", "success");
      } catch (err) {
        console.error("Failed to save task:", err);
        toast.show("保存失败，请重试", "error");
      }
      setModalTask(null);
      setModalReadOnly(false);
    },
    [modalTask, tasks, toast],
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
      />
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
