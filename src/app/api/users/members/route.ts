import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/db";

export async function GET() {
  const users = await getAllUsers();
  const members = users.filter((u) => u.role !== "admin").map((u) => u.name);
  return NextResponse.json(members);
}
