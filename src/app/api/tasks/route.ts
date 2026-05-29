import { NextResponse } from "next/server";
import { getAllTasks, createTask } from "@/lib/db";

export async function GET() {
  const tasks = getAllTasks();
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const body = await request.json();
  const task = createTask(body);
  return NextResponse.json(task, { status: 201 });
}
