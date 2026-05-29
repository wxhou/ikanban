import type { Task, TaskStatus, TaskPriority, TaskSource } from "./lib/types";

export function getInitials(name: string): string {
  return name.slice(0, 2);
}

const ASSIGNEE_COLORS = [
  "#2f6feb", "#f97316", "#7c3aed", "#16a34a", "#dc2626", "#0891b2",
];

export function getAssigneeColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ASSIGNEE_COLORS[Math.abs(hash) % ASSIGNEE_COLORS.length];
}

export function formatDate(d: string | null): string {
  if (!d) return "—";
  return d.slice(5).replace("-", "/");
}

export function exportToExcel(tasks: Task[]): void {
  const headers = [
    "任务名称", "描述", "状态", "优先级", "来源", "对接人", "负责人", "截止日期", "创建日期",
  ];
  const statusMap: Record<TaskStatus, string> = {
    todo: "待办", inprogress: "进行中", review: "审核中", blocked: "已阻塞", done: "已完成",
  };
  const priorityMap: Record<TaskPriority, string> = { high: "高", medium: "中", low: "低" };
  const sourceMap: Record<TaskSource, string> = { jiafang: "甲方", internal: "内部" };

  const rows = tasks.map((t) => [
    t.title,
    t.desc,
    statusMap[t.status] || t.status,
    priorityMap[t.priority] || t.priority,
    sourceMap[t.source] || t.source,
    t.requester || "—",
    t.assignees.join(", "),
    t.due || "—",
    t.created || "—",
  ]);

  const csvContent = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const BOM = "﻿";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `项目看板_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
