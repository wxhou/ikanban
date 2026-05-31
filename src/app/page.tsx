import { getAllTasks, getAllUsers } from "@/lib/db";
import type { Task } from "@/lib/types";
import App from "./App";

export default async function Page() {
  const [tasksResult, users] = await Promise.all([getAllTasks(), getAllUsers()]);
  const tasks = Array.isArray(tasksResult) ? tasksResult : tasksResult.data;
  return <App initialTasks={tasks as Task[]} initialUsers={users} />;
}
