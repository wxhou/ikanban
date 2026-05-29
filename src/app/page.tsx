import { getAllTasks } from "@/lib/db";
import App from "./App";

export default async function Page() {
  const tasks = getAllTasks();
  return <App initialTasks={tasks} />;
}
