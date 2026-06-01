import { NextResponse } from "next/server";
import { getAllTasks, getVersions } from "@/lib/db";
import { getValidatedUser } from "@/lib/auth";

const STATUS_LABELS: Record<string, string> = {
  todo: "待办",
  inprogress: "进行中",
  review: "审核中",
  verifying: "待验收",
  blocked: "已阻塞",
  done: "已完成",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const SOURCE_LABELS: Record<string, string> = {
  jiafang: "甲方",
  internal: "内部",
};

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function computeOverdueDays(due: string | null): number {
  if (!due) return 0;
  const dueDate = new Date(due);
  if (Number.isNaN(dueDate.getTime())) return 0;
  const today = new Date(todayDateString());
  const diff = Math.floor((today.getTime() - dueDate.getTime()) / 86_400_000);
  return diff > 0 ? diff : 0;
}

export async function GET(request: Request) {
  const user = await getValidatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const v = url.searchParams.get("v");
  const a = url.searchParams.get("a");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const opts: {
    source: string;
    assignee?: string;
    createdAfter?: string;
    createdBefore?: string;
    versionId?: number;
  } = { source: "jiafang" };
  if (v) {
    const parsed = Number(v);
    if (!Number.isNaN(parsed)) opts.versionId = parsed;
  }
  if (a) opts.assignee = a;
  if (from) opts.createdAfter = from;
  if (to) opts.createdBefore = to;

  const tasks = (await getAllTasks(opts)) as Array<{
    id: number;
    title: string;
    status: string;
    priority: string;
    source: string;
    assignees: string[];
    due: string | null;
    comments: { id: number }[];
  }>;

  const versions = await getVersions();
  const versionName = v ? versions.find((vv) => vv.id === Number(v))?.name ?? "all" : "all";
  const safeVersion = versionName.replace(/[\\/:*?"<>|]/g, "_");

  const header = ["title", "status", "priority", "assignee", "due", "overdue_days", "comments_count", "source"];
  const lines = [header.join(",")];
  for (const t of tasks) {
    const assignee = t.assignees.join("|");
    const due = t.due ?? "";
    const overdueDays = computeOverdueDays(t.due);
    const commentsCount = t.comments?.length ?? 0;
    lines.push(
      [
        csvEscape(t.title),
        csvEscape(STATUS_LABELS[t.status] ?? t.status),
        csvEscape(PRIORITY_LABELS[t.priority] ?? t.priority),
        csvEscape(assignee),
        due,
        String(overdueDays),
        String(commentsCount),
        csvEscape(SOURCE_LABELS[t.source] ?? t.source),
      ].join(","),
    );
  }

  const csv = "﻿" + lines.join("\n") + "\n";
  const filename = `portal-${safeVersion}-${todayDateString()}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
