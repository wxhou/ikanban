import { NextResponse } from "next/server";
import { getUniqueAssignees } from "@/lib/db";

export async function GET() {
  try {
    const assignees = await getUniqueAssignees();
    return NextResponse.json(assignees);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
