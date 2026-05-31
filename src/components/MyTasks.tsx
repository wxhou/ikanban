"use client";

import { memo, useMemo } from "react";
import type { Task, TaskStatus } from "@/lib/types";
import { COLUMNS } from "@/lib/types";
import { isOverdue, overdueDays, formatDate } from "@/utils";
import { getInitials, getAssigneeColor } from "@/utils";
import { updateTask } from "@/api";
import styles from "./MyTasks.module.css";

const priorityLabel: Record<string, string> = { high: "高", medium: "中", low: "低" };

interface MyTasksProps {
  tasks: Task[];
  currentUser: string;
  onClose: () => void;
  onSelectTask: (task: Task) => void;
  onTasksChange: (tasks: Task[]) => void;
}

export default memo(function MyTasks({ tasks, currentUser, onClose, onSelectTask, onTasksChange }: MyTasksProps) {
  const myTasks = useMemo(() =>
    tasks
      .filter((t) => t.assignees.includes(currentUser))
      .sort((a, b) => {
        const aO = isOverdue(a);
        const bO = isOverdue(b);
        if (aO && !bO) return -1;
        if (!aO && bO) return 1;
        if (a.due && b.due) return a.due.localeCompare(b.due);
        return 0;
      }),
    [tasks, currentUser]
  );

  const { activeCount, overdueCount, inProgressCount } = useMemo(() => ({
    activeCount: myTasks.filter((t) => t.status !== "done").length,
    overdueCount: myTasks.filter((t) => isOverdue(t)).length,
    inProgressCount: myTasks.filter((t) => t.status === "inprogress" || t.status === "review" || t.status === "verifying").length,
  }), [myTasks]);

  const handleQuickStatus = async (e: React.MouseEvent, task: Task, newStatus: TaskStatus) => {
    e.stopPropagation();
    try {
      const updated = await updateTask(task.id, { status: newStatus });
      onTasksChange(tasks.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <span className={styles.title}>我的待办</span>
            <span className={styles.headerCount}>{activeCount} 项</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {myTasks.length > 0 && (
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryNum}>{overdueCount}</span>
              <span className={styles.summaryLabel}>逾期</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryNum}>{inProgressCount}</span>
              <span className={styles.summaryLabel}>进行中</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryNum}>{myTasks.filter((t) => t.status === "todo").length}</span>
              <span className={styles.summaryLabel}>待办</span>
            </div>
          </div>
        )}

        <div className={styles.list}>
          {myTasks.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              </div>
              暂无待办任务
            </div>
          )}
          {myTasks.map((t) => {
            const col = COLUMNS.find((c) => c.id === t.status);
            const over = isOverdue(t);
            const colIdx = COLUMNS.indexOf(col!);
            const dotColors = ["var(--meta)", "var(--accent)", "var(--warn)", "#7c3aed", "var(--danger)", "var(--success)"];
            return (
              <div
                key={t.id}
                className={`${styles.item} ${over ? styles.overdue : ""}`}
                onClick={() => { onSelectTask(t); onClose(); }}
              >
                <div className={styles.itemTop}>
                  <span className={styles.itemTitle}>{t.title}</span>
                  {t.priority === "high" && <span className={styles.priorityBadge}>高</span>}
                  {over && <span className={styles.overdueBadge}>逾期 {overdueDays(t.due)}天</span>}
                </div>
                <div className={styles.itemMeta}>
                  <span className={styles.itemStatus}>
                    <span className={styles.dot} style={{ background: col ? dotColors[colIdx] : "#999" }} />
                    {col?.label}
                  </span>
                  <span>{formatDate(t.due)}</span>
                  {(t.status === "todo" || t.status === "inprogress") && (
                    <button
                      className={styles.quickDone}
                      onClick={(e) => handleQuickStatus(e, t, "done")}
                      title="标记完成"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
