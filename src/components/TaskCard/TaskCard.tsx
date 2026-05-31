"use client";

import { useState, useCallback, useRef, memo } from "react";
import type { Task } from "@/lib/types";
import { IconCalendar, IconWarning, IconCheckSquare, IconComment, IconSend } from "@/components/Icons";
import { getInitials, getAssigneeColor, formatDate, isOverdue, overdueDays, isDueSoon } from "@/utils";
import { createComment, getUserHeader } from "@/api";
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
  isSelected?: boolean;
  index?: number;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDragStart: (id: number) => void;
  onDragEnd: () => void;
  onDragOver: (id: number) => void;
  onDrop: (taskId: number) => void;
  onCommentAdded?: () => void;
  versionName?: string;
  currentUser?: string;
  onSelect?: (task: Task, e: React.MouseEvent) => void;
  onLinkView?: (taskId: number, e: React.MouseEvent) => void;
}

const TaskCard = memo(function TaskCard({
  task,
  isDragging,
  isDropTarget,
  isSelected = false,
  index = 0,
  onView,
  onEdit,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onCommentAdded,
  versionName,
  currentUser = "张三",
  onSelect,
  onLinkView,
}: TaskCardProps) {
  const overdue = isOverdue(task);
  const dueSoon = isDueSoon(task);
  const days = overdue ? overdueDays(task.due) : 0;
  const subtasks = task.subtasks || [];
  const subDone = subtasks.filter((s) => s.done).length;
  const subTotal = subtasks.length;
  const commentCount = (task.comments || []).length;
  const [showComment, setShowComment] = useState(false);
  const [commentText, setCommentText] = useState("");
  const didDrag = useRef(false);
  const isVerifying = task.status === "verifying";

  const handleAddComment = useCallback(async () => {
    if (!commentText.trim()) return;
    try {
      await createComment(task.id, currentUser, commentText.trim());
      setCommentText("");
      setShowComment(false);
      onCommentAdded?.();
      // Notify other assignees
      const others = (task.assignees || []).filter((a) => a !== currentUser);
      for (const p of others) {
        try {
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getUserHeader() },
            body: JSON.stringify({
              userName: p,
              type: "commented",
              text: `${currentUser} 评论了任务「${task.title}」`,
              taskId: task.id,
            }),
          });
        } catch { /* ignore */ }
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  }, [task.id, task.title, task.assignees, commentText, onCommentAdded, currentUser]);

  return (
    <div
      className={`${styles.card} ${isDragging ? styles.dragging : ""} ${isDropTarget ? styles.dropTarget : ""} ${overdue ? styles.overdue : ""} ${dueSoon ? styles.dueSoon : ""} ${isSelected ? styles.selected : ""}`}
      style={{ "--card-delay": `${Math.min(index, 8) * 30}ms` } as React.CSSProperties}
      draggable
      onDragStart={(e) => {
        didDrag.current = true;
        e.dataTransfer.setData("taskId", String(task.id));
        e.dataTransfer.effectAllowed = "move";
        onDragStart(task.id);
      }}
      onDragEnd={() => {
        setTimeout(() => { didDrag.current = false; }, 0);
        onDragEnd();
      }}
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
      onClick={(e) => {
        if (onSelect && (e.ctrlKey || e.metaKey)) {
          onSelect(task, e);
          return;
        }
        if (!didDrag.current) onView(task);
      }}
    >
      <div className={styles.top}>
        <span className={styles.priorityDot} style={{ background: priorityColor[task.priority] }} />
        <span className={styles.title}>{task.title}</span>
        <button className={styles.editBtn} onClick={(e) => { e.stopPropagation(); onEdit(task); }} title="编辑">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10.5 2.5l1 1-7 7-2 .5.5-2 7-7z" />
          </svg>
        </button>
      </div>
      {task.desc && (
        <div className={styles.body}>
          <div className={styles.desc}>{task.desc}</div>
        </div>
      )}
      <div className={styles.tags}>
        <span className={`${styles.tag} ${styles.tagSource}`}>{sourceLabel[task.source]}</span>
        {versionName && <span className={styles.versionTag}>{versionName}</span>}
        {task.linkedTasks && task.linkedTasks.map((link) => (
          <span
            key={link.id}
            className={`${styles.tag} ${link.linkType === "blocks" ? styles.tagBlocks : link.linkType === "blocked_by" ? styles.tagBlockedBy : styles.tagRelated}`}
            onClick={(e) => { e.stopPropagation(); onLinkView?.(link.linkedTaskId, e); }}
            title={link.linkedTaskTitle ? `跳转到「${link.linkedTaskTitle}」` : undefined}
          >
            {link.linkType === "blocks" ? "阻塞" : link.linkType === "blocked_by" ? "被阻塞" : "关联"}
          </span>
        ))}
        {task.requester && <span className={`${styles.tag} ${styles.tagRequester}`}>{task.requester}</span>}
        {isVerifying && <span className={styles.verifyingBadge}>待甲方验收</span>}
        {dueSoon && <span className={styles.dueSoonBadge}>即将到期</span>}
        {overdue && <span className={styles.overdueBadge}><IconWarning /> 逾期 {days} 天</span>}
        {task.tags && task.tags.map((t) => (
          <span key={t} className={`${styles.tag} ${styles.tagLabel}`}>{t}</span>
        ))}
      </div>
      {subTotal > 0 && (
        <div className={styles.progressWrap}>
          <span className={styles.progressLabel}><IconCheckSquare /> {subDone}/{subTotal}</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${Math.round((subDone / subTotal) * 100)}%` }} />
          </div>
        </div>
      )}
      <div className={styles.footer}>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <IconCalendar /> {formatDate(task.due)}
          </span>
          <span
            className={`${styles.metaItem} ${styles.commentToggle}`}
            onClick={(e) => { e.stopPropagation(); setShowComment(!showComment); }}
          >
            <IconComment /> {commentCount}
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
      {showComment && (
        <div className={styles.quickComment}>
          <textarea
            className={styles.quickCommentInput}
            placeholder="快速评论…"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
            autoFocus
          />
          <button className={styles.quickCommentSend} onClick={handleAddComment}>
            <IconSend />
          </button>
        </div>
      )}
    </div>
  );
});

export default TaskCard;
