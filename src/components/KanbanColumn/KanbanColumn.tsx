"use client";

import { useCallback } from "react";
import type { Task, TaskStatus } from "@/lib/types";
import { IconPlus } from "@/components/Icons";
import TaskCard from "@/components/TaskCard/TaskCard";
import styles from "./KanbanColumn.module.css";

interface Column {
  id: TaskStatus;
  label: string;
}

interface KanbanColumnProps {
  col: Column;
  tasks: Task[];
  dragId: number | null;
  dragOverId: number | null;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDragStart: (id: number) => void;
  onDragEnd: () => void;
  onDragOver: (id: number) => void;
  onDrop: (targetStatus: TaskStatus, targetTaskId?: number) => void;
  isDragging: boolean;
}

export default function KanbanColumn({
  col,
  tasks,
  dragId,
  dragOverId,
  onAddTask,
  onEditTask,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging,
}: KanbanColumnProps) {
  const handleDragEnd = useCallback(() => {
    onDragEnd();
  }, [onDragEnd]);

  const handleDragOver = useCallback((id: number) => {
    onDragOver(id);
  }, [onDragOver]);

  return (
    <div className={`${styles.col} ${isDragging ? styles.dropTarget : ""}`}>
      <div className={styles.head}>
        <span className={`${styles.dot} ${styles[`dot_${col.id}`]}`} />
        <span className={styles.colTitle}>{col.label}</span>
        <span className={styles.count}>{tasks.length}</span>
      </div>
      <div
        className={styles.body}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onDrop(col.id);
        }}
      >
        {tasks.length === 0 ? (
          <div className={styles.empty}>
            <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            暂无任务
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isDragging={task.id === dragId}
              isDropTarget={task.id === dragOverId}
              onEdit={onEditTask}
              onDragStart={onDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(taskId) => onDrop(col.id, taskId)}
            />
          ))
        )}
      </div>
      <div className={styles.footer}>
        <button className={styles.addBtn} onClick={onAddTask}>
          <IconPlus /> 添加任务
        </button>
      </div>
    </div>
  );
}
