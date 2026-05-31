import type { Task, Subtask, Comment, Version } from "@/lib/types";

function getUserHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const user = localStorage.getItem("currentUser");
  return user ? { "x-user": btoa(unescape(encodeURIComponent(user))) } : {};
}

const headers = { "Content-Type": "application/json" } as Record<string, string>;

// ── Version API ──

export async function fetchVersions(): Promise<Version[]> {
  const res = await fetch("/api/versions");
  if (!res.ok) throw new Error("Failed to fetch versions");
  return res.json();
}

export async function createVersion(name: string, description: string = ""): Promise<Version> {
  const res = await fetch("/api/versions", { method: "POST", headers: { ...headers, ...getUserHeader() }, body: JSON.stringify({ name, description }) });
  if (!res.ok) throw new Error("Failed to create version");
  return res.json();
}

export async function updateVersion(id: number, fields: { name?: string; status?: string; description?: string }): Promise<Version> {
  const res = await fetch(`/api/versions/${id}`, { method: "PATCH", headers: { ...headers, ...getUserHeader() }, body: JSON.stringify(fields) });
  if (!res.ok) throw new Error("Failed to update version");
  return res.json();
}

export async function deleteVersion(id: number): Promise<void> {
  const res = await fetch(`/api/versions/${id}`, { method: "DELETE", headers: getUserHeader() });
  if (!res.ok) throw new Error("Failed to delete version");
}

// ── Task API ──

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch("/api/tasks", { headers: getUserHeader() });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(
  task: Omit<Task, "id" | "created" | "updated" | "subtasks" | "comments">,
): Promise<Task> {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { ...headers, ...getUserHeader() },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function updateTask(
  id: number,
  fields: Partial<Omit<Task, "id" | "created" | "updated" | "subtasks" | "comments">>,
): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { ...headers, ...getUserHeader() },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, { method: "DELETE", headers: getUserHeader() });
  if (!res.ok) throw new Error("Failed to delete task");
}

// ── Subtask API ──

export async function createSubtask(taskId: number, text: string): Promise<Subtask> {
  const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
    method: "POST",
    headers: { ...headers, ...getUserHeader() },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Failed to create subtask");
  return res.json();
}

export async function updateSubtask(taskId: number, subtaskId: number, fields: { text?: string; done?: boolean }): Promise<Subtask> {
  const res = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: "PATCH",
    headers: { ...headers, ...getUserHeader() },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error("Failed to update subtask");
  return res.json();
}

export async function deleteSubtask(taskId: number, subtaskId: number): Promise<void> {
  const res = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, { method: "DELETE", headers: getUserHeader() });
  if (!res.ok) throw new Error("Failed to delete subtask");
}

// ── Comment API ──

export async function createComment(taskId: number, user: string, text: string, images: string[] = []): Promise<Comment> {
  const res = await fetch(`/api/tasks/${taskId}/comments`, {
    method: "POST",
    headers: { ...headers, ...getUserHeader() },
    body: JSON.stringify({ user, text, images }),
  });
  if (!res.ok) throw new Error("Failed to create comment");
  return res.json();
}

export async function deleteComment(taskId: number, commentId: number): Promise<void> {
  const res = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, { method: "DELETE", headers: getUserHeader() });
  if (!res.ok) throw new Error("Failed to delete comment");
}
