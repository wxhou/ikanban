import { NextResponse } from "next/server";
import { getUniqueAssignees } from "@/lib/db";
import { getValidatedUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getValidatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const assignees = await getUniqueAssignees();
    return NextResponse.json(assignees);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
