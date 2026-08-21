import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllUsers, findSessionByToken } from "@/lib/db";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  // Already-authenticated users should not see the login screen.
  const sid = (await cookies()).get("sid")?.value;
  if (sid) {
    const session = await findSessionByToken(sid);
    if (session) redirect("/home/kanban");
  }

  const users = await getAllUsers();
  return <LoginClient users={users} />;
}