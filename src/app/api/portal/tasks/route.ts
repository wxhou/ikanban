import { NextResponse } from "next/server";
import { getAllTasks } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = url.searchParams.get("page");
  const pageSize = url.searchParams.get("pageSize");
  const assignee = url.searchParams.get("assignee") || undefined;
  const createdAfter = url.searchParams.get("createdAfter") || undefined;
  const createdBefore = url.searchParams.get("createdBefore") || undefined;

  if (page && pageSize) {
    const result = await getAllTasks({ page: Number(page), pageSize: Number(pageSize), source: "jiafang", assignee, createdAfter, createdBefore });
    return NextResponse.json(result);
  }

  const tasks = await getAllTasks({ source: "jiafang", assignee, createdAfter, createdBefore });
  return NextResponse.json(tasks);
}
