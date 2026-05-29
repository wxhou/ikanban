"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import type { Task, TaskStatus } from "@/lib/types";
import { COLUMNS } from "@/lib/types";
import FilterBar from "@/components/FilterBar/FilterBar";
import KanbanColumn from "@/components/KanbanColumn/KanbanColumn";
import { fetchTasks, updateTask } from "@/api";
import styles from "./KanbanBoard.module.css";

interface KanbanBoardProps {
  initialTasks: Task[];
  onEditTask: (task: Task) => void;
  onTasksChange: (tasks: Task[]) => void;
}

export default function KanbanBoard({ initialTasks, onEditTask, onTasksChange }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  // 使用 ref 保存 dragId，避免闭包问题
  const dragIdRef = useRef<number | null>(null);

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => {
        if (filter === "jiafang") return t.source === "jiafang";
        if (filter === "internal") return t.source === "internal";
        if (filter === "mine") return t.assignees.includes("张三");
        return true;
      })
      .filter((t) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          (t.desc && t.desc.toLowerCase().includes(q)) ||
          (t.requester && t.requester.includes(q))
        );
      });
  }, [tasks, filter, search]);

  const tasksByStatus = useMemo(() => {
    const map: Record<string, Task[]> = {};
    COLUMNS.forEach((c) => {
      map[c.id] = filtered.filter((t) => t.status === c.id);
    });
    return map;
  }, [filtered]);

  const handleDragStart = useCallback((id: number) => {
    dragIdRef.current = id;
  }, []);
  const handleDragEnd = useCallback(() => {
    dragIdRef.current = null;
    setDragOverId(null);
  }, []);
  const handleDragOver = useCallback((id: number) => {
    setDragOverId(id);
  }, []);

  const handleDrop = useCallback(
    async (targetStatus: TaskStatus, targetTaskId?: number) => {
      const currentDragId = dragIdRef.current;
      if (!currentDragId) return;

      const draggedTask = tasks.find((t) => t.id === currentDragId);
      if (!draggedTask) return;

      let newTasks: Task[];

      if (draggedTask.status === targetStatus && targetTaskId && targetTaskId !== currentDragId) {
        const sameCol = tasks.filter((t) => t.status === targetStatus);
        const others = tasks.filter((t) => t.status !== targetStatus);
        const dragIdx = sameCol.findIndex((t) => t.id === currentDragId);
        const [moved] = sameCol.splice(dragIdx, 1);
        const targetIdx = sameCol.findIndex((t) => t.id === targetTaskId);
        sameCol.splice(targetIdx, 0, moved);
        newTasks = [...others, ...sameCol];
      } else if (draggedTask.status !== targetStatus) {
        newTasks = tasks.map((t) =>
          t.id === currentDragId ? { ...t, status: targetStatus } : t,
        );
      } else {
        return;
      }

      setTasks(newTasks);
      onTasksChange(newTasks);

      try {
        await updateTask(currentDragId, { status: targetStatus });
      } catch {
        setTasks(tasks);
        onTasksChange(tasks);
      }
    },
    [tasks, onTasksChange],
  );

  const handleFilterChange = useCallback(async (newFilter: string) => {
    setFilter(newFilter);
    const fresh = await fetchTasks();
    setTasks(fresh);
    onTasksChange(fresh);
  }, [onTasksChange]);

  return (
    <div className={styles.wrap}>
      <FilterBar
        filter={filter}
        onFilterChange={handleFilterChange}
        taskCount={tasks.length}
        filteredCount={filtered.length}
        search={search}
        onSearchChange={setSearch}
      />
      <div className={styles.board}>
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            col={col}
            tasks={tasksByStatus[col.id]}
            dragId={dragIdRef.current}
            onAddTask={() => onEditTask({ ...({} as Task), status: col.id } as Task)}
            onEditTask={onEditTask}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            dragOverId={dragOverId}
            isDragging={dragIdRef.current !== null}
          />
        ))}
      </div>
    </div>
  );
}
