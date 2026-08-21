import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllTasks, getAllUsers, getVersions, findSessionByToken } from "@/lib/db";
import type { Task } from "@/lib/types";
import { AppProvider } from "@/lib/context/app-context";
import { UIContextProvider } from "@/lib/context/ui-context";
import { ToastProvider } from "@/lib/toast-context";
import TopNav from "@/components/TopNav/TopNav";
import SharedUI from "./SharedUI";

export default async function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side auth guard: validate the `sid` session cookie before rendering any business data.
  const sid = (await cookies()).get("sid")?.value;
  if (!sid) redirect("/login");
  const session = await findSessionByToken(sid);
  if (!session) redirect("/login");

  // Fetch initial data in parallel; the layout injects it into AppProvider as initial state.
  const [tasksResult, users, versions] = await Promise.all([getAllTasks(), getAllUsers(), getVersions()]);
  const tasks = Array.isArray(tasksResult) ? tasksResult : tasksResult.data;
  const members = users.filter((u) => u.role !== "admin").map((u) => u.name);

  return (
    <ToastProvider>
      <UIContextProvider>
        <AppProvider initialTasks={tasks as Task[]} initialUsers={users} initialVersions={versions} initialMembers={members}>
          <TopNav />
          {children}
          <SharedUI />
        </AppProvider>
      </UIContextProvider>
    </ToastProvider>
  );
}