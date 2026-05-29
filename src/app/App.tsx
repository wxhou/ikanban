"use client";

import { useState, useCallback } from "react";
import type { Task } from "@/lib/types";
import TopNav from "@/components/TopNav/TopNav";
import KanbanBoard from "@/components/KanbanBoard";
import Dashboard from "@/components/Dashboard";
import TaskModal from "@/components/TaskModal/TaskModal";
import { createTask, updateTask } from "@/api";

interface AppProps {
  initialTasks: Task[];
}

export default function App({ initialTasks }: AppProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [view, setView] = useState<"kanban" | "dashboard">("kanban");
  const [modalTask, setModalTask] = useState<Task | null>(null);

  const handleSaveTask = useCallback(
    async (saved: Omit<Task, "id" | "created" | "updated">) => {
      try {
        if (modalTask?.id) {
          const updated = await updateTask(modalTask.id, saved);
          const newTasks = tasks.map((t) => (t.id === updated.id ? updated : t));
          setTasks(newTasks);
        } else {
          const created = await createTask(saved);
          setTasks([...tasks, created]);
        }
      } catch (err) {
        console.error("Failed to save task:", err);
      }
      setModalTask(null);
    },
    [modalTask, tasks],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <TopNav view={view} onViewChange={setView} />
      {view === "kanban" ? (
        <KanbanBoard
          initialTasks={tasks}
          onEditTask={setModalTask}
          onTasksChange={setTasks}
        />
      ) : (
        <Dashboard tasks={tasks} />
      )}
      {modalTask !== null && (
        <TaskModal
          task={modalTask}
          onSave={handleSaveTask}
          onClose={() => setModalTask(null)}
        />
      )}
    </div>
  );
}
