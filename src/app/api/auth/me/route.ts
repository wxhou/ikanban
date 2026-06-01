import { NextResponse } from "next/server";
import { getValidatedUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getValidatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ name: user.name, role: user.role });
}
