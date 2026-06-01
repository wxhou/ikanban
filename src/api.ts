import type { Task, Subtask, Comment, Version } from "@/lib/types";

const jsonHeaders = { "Content-Type": "application/json" } as Record<string, string>;

// ── Version API ──

export async function fetchVersions(): Promise<Version[]> {
  const res = await fetch("/api/versions");
  if (!res.ok) throw new Error("Failed to fetch versions");
  return res.json();
}

export async function createVersion(name: string, description: string = ""): Promise<Version> {
  const res = await fetch("/api/versions", { method: "POST", headers: jsonHeaders, body: JSON.stringify({ name, description }) });
  if (!res.ok) throw new Error("Failed to create version");
  return res.json();
}

export async function updateVersion(id: number, fields: { name?: string; status?: string; description?: string }): Promise<Version> {
  const res = await fetch(`/api/versions/${id}`, { method: "PATCH", headers: jsonHeaders, body: JSON.stringify(fields) });
  if (!res.ok) throw new Error("Failed to update version");
  return res.json();
}

export async function deleteVersion(id: number): Promise<void> {
  const res = await fetch(`/api/versions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete version");
}

// ── Task API ──

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch("/api/tasks");
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(
  task: Omit<Task, "id" | "created" | "updated" | "subtasks" | "comments">,
): Promise<Task> {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: jsonHeaders,
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
    headers: jsonHeaders,
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete task");
}

// ── Subtask API ──

export async function createSubtask(taskId: number, text: string): Promise<Subtask> {
  const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Failed to create subtask");
  return res.json();
}

export async function updateSubtask(taskId: number, subtaskId: number, fields: { text?: string; done?: boolean }): Promise<Subtask> {
  const res = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error("Failed to update subtask");
  return res.json();
}

export async function deleteSubtask(taskId: number, subtaskId: number): Promise<void> {
  const res = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete subtask");
}

// ── Comment API ──

export async function createComment(taskId: number, user: string, text: string, images: string[] = []): Promise<Comment> {
  const res = await fetch(`/api/tasks/${taskId}/comments`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ user, text, images }),
  });
  if (!res.ok) throw new Error("Failed to create comment");
  return res.json();
}

export async function deleteComment(taskId: number, commentId: number): Promise<void> {
  const res = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete comment");
}
