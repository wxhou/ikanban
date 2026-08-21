"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { Task, Notification as NotifType } from "@/lib/types";
import { useToast } from "@/lib/toast-context";
import { createTask, updateTask, deleteTask } from "@/api";
import { filterTasksByRole } from "@/utils";
import { useApp } from "@/lib/context/app-context";
import { useUI } from "@/lib/context/ui-context";
import TaskModal from "@/components/TaskModal/TaskModal";
import NotificationPanel from "@/components/NotificationPanel/NotificationPanel";
import MyTasks from "@/components/MyTasks";
import UserManagement from "@/components/UserManagement";

function SharedUIInner() {
  const {
    tasks, setTasks, versions, activeVersionId,
    currentUser, currentUserRole, isAdmin, members,
    notifications, setNotifications, unreadCount, setUnreadCount,
    users, refreshUsers,
  } = useApp();
  const {
    modalTask, modalReadOnly, closeTask, openTask,
    showMyTasks, setShowMyTasks, showUserManagement, setShowUserManagement,
    showNotifications, setShowNotifications,
  } = useUI();
  const toast = useToast();

  // Compute effective tasks based on current user's role (same as App.tsx)
  const effectiveTasks = useMemo(() => {
    if (!currentUser || !currentUserRole) return tasks;
    return filterTasksByRole(tasks, currentUser, currentUserRole);
  }, [tasks, currentUser, currentUserRole]);

  // Global keyboard shortcuts: n/N opens new-task modal, / focuses search input.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (modalTask !== null) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        openTask({ status: "todo" } as Task, false);
      }
      if (e.key === "/") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modalTask, openTask]);

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

          for (const assignee of addedAssignees) {
            if (assignee !== currentUser) {
              try {
                await fetch("/api/notifications", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
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

          for (const assignee of addedAssignees) {
            if (assignee !== currentUser) {
              try {
                await fetch("/api/notifications", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
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
      closeTask();
    },
    [modalTask, tasks, toast, currentUser, closeTask, setTasks],
  );

  const handleDeleteTask = useCallback(
    async (id: number) => {
      try {
        await deleteTask(id);
        setTasks(tasks.filter((t) => t.id !== id));
        toast.show("已删除", "success");
      } catch (err) {
        console.error("Failed to delete task:", err);
        toast.show("删除失败，请重试", "error");
      }
      closeTask();
    },
    [toast, tasks, closeTask, setTasks],
  );

  const handleMarkNotifRead = useCallback(
    async (id: number) => {
      if (!currentUser) return;
      try {
        await fetch(`/api/notifications?id=${id}&user=${encodeURIComponent(currentUser)}`, { method: "PATCH" });
        setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
        setUnreadCount(Math.max(0, unreadCount - 1));
      } catch { /* ignore */ }
    },
    [currentUser, notifications, unreadCount, setNotifications, setUnreadCount],
  );

  const handleMarkAllNotifRead = useCallback(
    async () => {
      if (!currentUser) return;
      try {
        await fetch(`/api/notifications?user=${encodeURIComponent(currentUser)}`, { method: "PATCH" });
        setNotifications(notifications.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      } catch { /* ignore */ }
    },
    [currentUser, notifications, setNotifications, setUnreadCount],
  );

  const handleClickNotif = useCallback(
    (notif: NotifType) => {
      if (notif.taskId) {
        const task = tasks.find((t) => t.id === notif.taskId);
        if (task) {
          openTask(task, true);
        }
      }
      setShowNotifications(false);
    },
    [tasks, openTask, setShowNotifications],
  );

  return (
    <>
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
        <MyTasks tasks={effectiveTasks} currentUser={currentUser ?? ""} onClose={() => setShowMyTasks(false)} onSelectTask={(t) => { openTask(t, true); setShowMyTasks(false); }} onTasksChange={setTasks} />
      )}
      {showUserManagement && isAdmin && (
        <UserManagement users={users} onClose={() => setShowUserManagement(false)} onUserChange={refreshUsers} />
      )}
      {modalTask !== null && (
        <TaskModal task={modalTask} onSave={handleSaveTask} onDelete={handleDeleteTask} onClose={closeTask} readOnly={modalReadOnly} versions={versions} defaultVersionId={activeVersionId} currentUser={currentUser ?? undefined} members={members} />
      )}
    </>
  );
}

export default function SharedUI() {
  return <SharedUIInner />;
}