"use client";

import type { Task } from "@/lib/types";
import { IconCalendar } from "@/components/Icons";
import { getInitials, getAssigneeColor, formatDate } from "@/utils";
import styles from "./TaskCard.module.css";

const priorityColor: Record<string, string> = {
  high: "var(--danger)",
  medium: "var(--warn)",
  low: "var(--success)",
};

const sourceLabel: Record<string, string> = {
  jiafang: "甲方",
  internal: "内部",
};

interface TaskCardProps {
  task: Task;
  isDragging: boolean;
  isDropTarget: boolean;
  onEdit: (task: Task) => void;
  onDragStart: (id: number) => void;
  onDragEnd: () => void;
  onDragOver: (id: number) => void;
  onDrop: (taskId: number) => void;
}

export default function TaskCard({
  task,
  isDragging,
  isDropTarget,
  onEdit,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: TaskCardProps) {
  return (
    <div
      className={`${styles.card} ${isDragging ? styles.dragging : ""} ${isDropTarget ? styles.dropTarget : ""}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("taskId", String(task.id));
        e.dataTransfer.effectAllowed = "move";
        onDragStart(task.id);
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver(task.id);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop(task.id);
      }}
      onDoubleClick={() => onEdit(task)}
    >
      <div className={styles.top}>
        <span className={styles.priorityDot} style={{ background: priorityColor[task.priority] }} />
        <span className={styles.title}>{task.title}</span>
      </div>
      {task.desc && (
        <div className={styles.body}>
          <div className={styles.desc}>{task.desc}</div>
        </div>
      )}
      <div className={styles.tags}>
        <span className={`${styles.tag} ${styles.tagSource}`}>{sourceLabel[task.source]}</span>
        {task.requester && <span className={`${styles.tag} ${styles.tagRequester}`}>{task.requester}</span>}
      </div>
      <div className={styles.footer}>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <IconCalendar /> {formatDate(task.due)}
          </span>
        </div>
        <div className={styles.assignees}>
          {task.assignees.slice(0, 3).map((a, i) => (
            <div
              key={a}
              className={styles.assignee}
              style={{
                background: getAssigneeColor(a),
                marginLeft: i > 0 ? -6 : 0,
                zIndex: 10 - i,
              }}
            >
              {getInitials(a)}
            </div>
          ))}
          {task.assignees.length > 3 && (
            <div className={styles.assignee} style={{ background: "var(--muted)", marginLeft: -6 }}>
              +{task.assignees.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
