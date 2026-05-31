import { NextResponse } from "next/server";
import { getAllTasks, createTask } from "@/lib/db";
import { getValidatedUser, requireUser } from "@/lib/auth";
import { filterTasksByRole } from "@/utils";

export async function GET(request: Request) {
  const user = await getValidatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const page = url.searchParams.get("page");
  const pageSize = url.searchParams.get("pageSize");
  const assignee = url.searchParams.get("assignee") || undefined;
  const createdAfter = url.searchParams.get("createdAfter") || undefined;
  const createdBefore = url.searchParams.get("createdBefore") || undefined;

  // Determine SQL-level source filter based on role
  let sourceFilter: string | undefined;
  if (user.role === "client") {
    sourceFilter = "jiafang";
  }

  if (page && pageSize) {
    const result = await getAllTasks({ page: Number(page), pageSize: Number(pageSize), source: sourceFilter, assignee, createdAfter, createdBefore });
    return NextResponse.json(result);
  }

  let tasks = await getAllTasks({ source: sourceFilter, assignee, createdAfter, createdBefore }) as Awaited<ReturnType<typeof getAllTasks>>;
  if (!Array.isArray(tasks)) {
    tasks = tasks.data;
  }
  // For developers, apply JS filter (complex JSON array contains logic)
  if (user.role !== "client") {
    tasks = filterTasksByRole(tasks, user.name, user.role);
  }
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const task = await createTask(body);
  return NextResponse.json(task, { status: 201 });
}
