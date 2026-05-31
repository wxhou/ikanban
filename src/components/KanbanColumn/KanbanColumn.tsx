"use client";

import { useCallback, useState, useRef, useEffect, memo } from "react";
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
  onQuickAdd?: (title: string, status: TaskStatus) => Promise<void>;
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDragStart: (id: number) => void;
  onDragEnd: () => void;
  onDragOver: (id: number) => void;
  onDrop: (targetStatus: TaskStatus, targetTaskId?: number) => void;
  isDragging: boolean;
  onCommentAdded: () => void;
  readonly: boolean;
  getVersionName?: (id: number | null) => string | undefined;
  currentUser?: string;
  selectedIds?: Set<number>;
  onSelectTask?: (task: Task, e: React.MouseEvent) => void;
}

const KanbanColumn = memo(function KanbanColumn({
  col,
  tasks,
  dragId,
  dragOverId,
  onQuickAdd,
  onViewTask,
  onEditTask,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging,
  onCommentAdded,
  readonly,
  getVersionName,
  currentUser,
  selectedIds,
  onSelectTask,
}: KanbanColumnProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showQuickAdd && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showQuickAdd]);

  const handleQuickAddSubmit = useCallback(async () => {
    const title = quickAddTitle.trim();
    if (!title || !onQuickAdd) return;
    setQuickAddLoading(true);
    try {
      await onQuickAdd(title, col.id);
      setQuickAddTitle("");
      setShowQuickAdd(false);
    } catch {
      // keep input open on error
    } finally {
      setQuickAddLoading(false);
    }
  }, [quickAddTitle, onQuickAdd, col.id]);

  const handleQuickAddKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleQuickAddSubmit();
    }
    if (e.key === "Escape") {
      setShowQuickAdd(false);
      setQuickAddTitle("");
    }
  }, [handleQuickAddSubmit]);
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
          tasks.map((task, idx) => (
            <TaskCard
              key={task.id}
              task={task}
              isDragging={task.id === dragId}
              isDropTarget={task.id === dragOverId}
              isSelected={selectedIds?.has(task.id) ?? false}
              index={idx}
              onView={onViewTask}
              onEdit={onEditTask}
              onDragStart={onDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(taskId) => onDrop(col.id, taskId)}
              onCommentAdded={onCommentAdded}
              versionName={getVersionName?.(task.versionId)}
              currentUser={currentUser}
              onSelect={onSelectTask}
            />
          ))
        )}
        {!readonly && (
          showQuickAdd ? (
            <div className={styles.quickAddWrap}>
              <input
                ref={inputRef}
                className={styles.quickAddInput}
                placeholder="输入任务标题…"
                value={quickAddTitle}
                onChange={(e) => setQuickAddTitle(e.target.value)}
                onKeyDown={handleQuickAddKeyDown}
                onBlur={() => {
                  if (!quickAddTitle.trim()) {
                    setShowQuickAdd(false);
                  }
                }}
                disabled={quickAddLoading}
              />
              <div className={styles.quickAddActions}>
                <button
                  className={styles.quickAddSubmit}
                  onMouseDown={(e) => { e.preventDefault(); handleQuickAddSubmit(); }}
                  disabled={quickAddLoading || !quickAddTitle.trim()}
                >
                  添加
                </button>
                <button
                  className={styles.quickAddCancel}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setShowQuickAdd(false);
                    setQuickAddTitle("");
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button className={styles.addBtn} onClick={() => setShowQuickAdd(true)}>
              <IconPlus /> 添加任务
            </button>
          )
        )}
      </div>
    </div>
  );
});

export default KanbanColumn;
