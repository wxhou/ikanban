"use client";

import { useState, useCallback } from "react";
import type { Task, TaskStatus, TaskPriority, TaskSource, Subtask, Comment, Version } from "@/lib/types";
import { COLUMNS, JIAFANG_SOURCES } from "@/lib/types";
import { useToast } from "@/lib/toast-context";
import { IconX, IconPlus, IconSend, IconTrash } from "@/components/Icons";
import { getInitials, getAssigneeColor } from "@/utils";
import { createSubtask, updateSubtask, deleteSubtask, createComment, deleteComment } from "@/api";
import styles from "./TaskModal.module.css";

type TabId = "info" | "subtasks" | "comments";

interface TaskModalProps {
  task: Partial<Task> & { status?: TaskStatus };
  onSave: (task: Omit<Task, "id" | "created" | "updated" | "subtasks" | "comments">) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
  readOnly?: boolean;
  versions?: Version[];
  defaultVersionId?: number | null;
  currentUser?: string;
  members?: string[];
}

export default function TaskModal({ task, onSave, onDelete, onClose, readOnly, versions = [], defaultVersionId, currentUser = "张三", members = [] }: TaskModalProps) {
  const isNew = !task.id;
  const [tab, setTab] = useState<TabId>("info");
  const [form, setForm] = useState({
    title: task.title || "",
    desc: task.desc || "",
    status: (task.status || "todo") as TaskStatus,
    priority: (task.priority || "medium") as TaskPriority,
    source: (task.source || "internal") as TaskSource,
    requester: task.requester || "",
    assignees: task.assignees || ([] as string[]),
    tags: task.tags || ([] as string[]),
    versionId: task.versionId ?? defaultVersionId ?? null,
    due: task.due || "",
  });
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [comments, setComments] = useState<Comment[]>(task.comments || []);
  const [commentText, setCommentText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [commentImages, setCommentImages] = useState<string[]>([]);
  const toast = useToast();

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const toggleAssignee = (name: string) => {
    setForm((f) => ({
      ...f,
      assignees: f.assignees.includes(name)
        ? f.assignees.filter((a) => a !== name)
        : [...f.assignees, name],
    }));
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave({
      title: form.title,
      desc: form.desc,
      status: form.status,
      priority: form.priority,
      source: form.source,
      requester: form.source === "jiafang" ? form.requester : null,
      assignees: form.assignees,
      tags: form.tags,
      versionId: form.versionId,
      due: form.due || null,
    });
  };

  // ── Subtask handlers ──
  const handleAddSubtask = useCallback(async () => {
    if (!task.id) return;
    try {
      const created = await createSubtask(task.id, "");
      setSubtasks((prev) => [...prev, created]);
    } catch (err) {
      console.error("Failed to add subtask:", err);
      toast.show("添加子任务失败", "error");
    }
  }, [task.id]);

  const handleToggleSubtask = useCallback(async (sub: Subtask) => {
    if (!task.id) return;
    try {
      const updated = await updateSubtask(task.id, sub.id, { done: !sub.done });
      setSubtasks((prev) => prev.map((s) => (s.id === sub.id ? updated : s)));
    } catch (err) {
      console.error("Failed to toggle subtask:", err);
      toast.show("操作失败", "error");
    }
  }, [task.id]);

  const handleSubtaskTextChange = useCallback(async (sub: Subtask, text: string) => {
    if (!task.id) return;
    setSubtasks((prev) => prev.map((s) => (s.id === sub.id ? { ...s, text } : s)));
    try {
      await updateSubtask(task.id, sub.id, { text });
    } catch (err) {
      toast.show("操作失败", "error");
    }
  }, [task.id]);

  const handleDeleteSubtask = useCallback(async (sub: Subtask) => {
    if (!task.id) return;
    try {
      await deleteSubtask(task.id, sub.id);
      setSubtasks((prev) => prev.filter((s) => s.id !== sub.id));
    } catch (err) {
      toast.show("操作失败", "error");
    }
  }, [task.id]);

  // ── Comment handlers ──
  const handleAddComment = useCallback(async () => {
    if (!task.id || (!commentText.trim() && commentImages.length === 0)) return;
    try {
      const created = await createComment(task.id, currentUser, commentText.trim(), commentImages);
      setComments((prev) => [...prev, created]);
      setCommentText("");
      setCommentImages([]);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("新评论", { body: `${currentUser}: ${commentText.trim().slice(0, 50)}` });
      }
    } catch (err) {
      toast.show("评论发送失败", "error");
    }
  }, [task.id, commentText, commentImages]);

  const handleDeleteComment = useCallback(async (comment: Comment) => {
    if (!task.id) return;
    try {
      await deleteComment(task.id, comment.id);
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
    } catch (err) {
      toast.show("操作失败", "error");
    }
  }, [task.id]);

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.head}>
          <h2 className={styles.title}>{isNew ? "新建任务" : readOnly ? "任务详情" : "编辑任务"}</h2>
          <button className={styles.close} onClick={onClose}>
            <IconX />
          </button>
        </div>

        {!isNew && (
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === "info" ? styles.tabActive : ""}`} onClick={() => setTab("info")}>
              基本信息
            </button>
            <button className={`${styles.tab} ${tab === "subtasks" ? styles.tabActive : ""}`} onClick={() => setTab("subtasks")}>
              子任务 {subtasks.length > 0 ? `(${subtasks.length})` : ""}
            </button>
            <button className={`${styles.tab} ${tab === "comments" ? styles.tabActive : ""}`} onClick={() => setTab("comments")}>
              评论 {comments.length > 0 ? `(${comments.length})` : ""}
            </button>
          </div>
        )}

        {(tab === "info" || isNew) && (
          <div className={styles.body}>
            <div className={styles.row}>
              <label className={styles.label}>任务标题 *</label>
              <input
                className={styles.input}
                placeholder="简要描述任务内容"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                disabled={readOnly}
                autoFocus
              />
            </div>
            <div className={styles.row}>
              <label className={styles.label}>详细描述</label>
              <textarea
                className={styles.input}
                placeholder="补充背景、要求、注意事项…"
                value={form.desc}
                onChange={(e) => set("desc", e.target.value)}
                disabled={readOnly}
                rows={3}
              />
            </div>
            <div className={styles.rowInline}>
              <div className={styles.row}>
                <label className={styles.label}>状态</label>
                <select className={styles.input} value={form.status} onChange={(e) => set("status", e.target.value)} disabled={readOnly}>
                  {COLUMNS.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.row}>
                <label className={styles.label}>优先级</label>
                <select className={styles.input} value={form.priority} onChange={(e) => set("priority", e.target.value)} disabled={readOnly}>
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
            </div>
            <div className={styles.row}>
              <label className={styles.label}>任务来源</label>
              <div className={styles.tagSelect}>
                {(["jiafang", "internal"] as const).map((src) => (
                  <button
                    key={src}
                    type="button"
                    className={`${styles.tagOption} ${form.source === src ? styles.tagOptionSelected : ""}`}
                    onClick={() => !readOnly && set("source", src)}
                  >
                    {src === "jiafang" ? "甲方任务" : "内部任务"}
                  </button>
                ))}
              </div>
            </div>
            {form.source === "jiafang" && (
              <div className={styles.row}>
                <label className={styles.label}>甲方对接人</label>
                <div className={styles.tagSelect}>
                  {JIAFANG_SOURCES.map((src) => (
                    <button
                      key={src}
                      type="button"
                      className={`${styles.tagOption} ${form.requester === src ? styles.tagOptionSelected : ""}`}
                      onClick={() => !readOnly && set("requester", form.requester === src ? "" : src)}
                    >
                      {src}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className={styles.row}>
              <label className={styles.label}>
                负责人 <span style={{ fontWeight: 400, color: "var(--muted)" }}>（可多选）</span>
              </label>
              <div className={styles.assigneeGrid}>
                {members.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={`${styles.assigneeChip} ${form.assignees.includes(name) ? styles.assigneeChipSelected : ""}`}
                    onClick={() => !readOnly && toggleAssignee(name)}
                  >
                    <div
                      style={{
                        width: 16, height: 16, borderRadius: "50%",
                        background: getAssigneeColor(name),
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, color: "white", fontWeight: 700,
                      }}
                    >
                      {getInitials(name)}
                    </div>
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.row}>
              <label className={styles.label}>截止日期</label>
              <input className={styles.input} type="date" value={form.due} onChange={(e) => set("due", e.target.value)} disabled={readOnly} />
            </div>
            <div className={styles.row}>
              <label className={styles.label}>版本</label>
              <select
                className={styles.input}
                value={form.versionId ?? ""}
                onChange={(e) => set("versionId", e.target.value ? Number(e.target.value) : null)}
                disabled={readOnly}
              >
                <option value="">未分配</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.status === "active" ? "活跃" : "已发布"})</option>
                ))}
              </select>
            </div>
            <div className={styles.row}>
              <label className={styles.label}>标签</label>
              <input
                className={styles.input}
                placeholder="逗号分隔，如：UI, 设计, 紧急"
                value={form.tags.join(", ")}
                onChange={(e) => set("tags", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
              />
            </div>
          </div>
        )}

        {tab === "subtasks" && !isNew && (
          <div className={styles.body}>
            <div className={styles.subtaskList}>
              {subtasks.length === 0 && (
                <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", padding: "var(--space-2) 0" }}>
                  暂无子任务，点击下方添加
                </div>
              )}
              {subtasks.map((sub) => (
                <div key={sub.id} className={`${styles.subtaskItem} ${sub.done ? styles.subtaskDone : ""}`}>
                  <input
                    type="checkbox"
                    checked={sub.done}
                    onChange={() =>!readOnly && handleToggleSubtask(sub)}
                  />
                  <input
                    className={styles.subtaskTextInput}
                    value={sub.text}
                    placeholder="子任务描述"
                    onChange={(e) => !readOnly && handleSubtaskTextChange(sub, e.target.value)}
                  disabled={readOnly}
                  />
                  {!readOnly && <button className={styles.subtaskDelete} onClick={() => handleDeleteSubtask(sub)}>
                    <IconTrash />
                  </button>}
                </div>
              ))}
            </div>
            {!readOnly && <button className={styles.subtaskAdd} onClick={handleAddSubtask}>
              <IconPlus /> 添加子任务
            </button>}
          </div>
        )}

        {tab === "comments" && !isNew && (
          <div className={styles.body}>
            <div className={styles.commentList}>
              {comments.length === 0 && (
                <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", padding: "var(--space-2) 0" }}>
                  暂无评论
                </div>
              )}
              {comments.map((c) => (
                <div key={c.id} className={styles.commentItem}>
                  <div className={styles.commentHeader}>
                    <div className={styles.commentAvatar} style={{ background: getAssigneeColor(c.user) }}>
                      {getInitials(c.user)}
                    </div>
                    <span className={styles.commentMeta}>{c.user} · {c.created}</span>
                  </div>
                  <div className={styles.commentText}>{c.text}</div>
                  {c.images && c.images !== "[]" && (
                    <div className={styles.commentImages}>
                      {(JSON.parse(c.images) as string[]).map((img, idx) => (
                        <img key={idx} src={img} className={styles.commentImg} alt="" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!readOnly && (
          <div className={styles.commentInputRow}>
              <div className={styles.commentInputWrap}>
                {commentImages.length > 0 && (
                  <div className={styles.commentPreviewImages}>
                    {commentImages.map((img, idx) => (
                      <img key={idx} src={img} className={styles.commentPreviewImg} alt="" />
                    ))}
                  </div>
                )}
                <div className={styles.commentInputBottom}>
                  <label className={styles.uploadBtn}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2v8M4 6l4-4 4 4M2 12v2h12v-2"/></svg>
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      const fd = new FormData(); fd.append("file", file);
                      try {
                        const res = await fetch("/api/uploads", { method: "POST", body: fd });
                        const data = await res.json();
                        setCommentImages((prev) => [...prev, data.path]);
                      } catch (err) { console.error("Upload failed:", err); toast.show("上传失败", "error"); }
                      setUploading(false);
                    }} />
                  </label>
                  <textarea
                    placeholder="添加评论…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  <button className={styles.commentSendBtn} onClick={handleAddComment} disabled={uploading}>
                <IconSend />
              </button>
              </div>
              </div>
            </div>
            )}
          </div>
        )}

        <div className={styles.foot}>
          {!isNew && !readOnly && (
            <button
              className={`${styles.btn} ${styles.btnDanger}`}
              onClick={() => {
                if (confirm("确认删除该任务？")) onDelete(task.id!);
              }}
            >
              <IconTrash /> 删除
            </button>
          )}
          {!readOnly && <div className={styles.footSpacer} />}
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>
            {readOnly ? "关闭" : "取消"}
          </button>
          {!readOnly && (
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSave}>
              {isNew ? "创建任务" : "保存修改"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
