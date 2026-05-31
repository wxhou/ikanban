import { NextResponse } from "next/server";
import { batchUpdateTasks } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await requireUser(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ids, updates } = await request.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  const updated = await batchUpdateTasks(ids, updates || {});
  return NextResponse.json({ updated });
}
