import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "sid",
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 8 * 60 * 60,
  });
}
