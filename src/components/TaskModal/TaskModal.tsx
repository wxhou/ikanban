"use client";

import { useState } from "react";
import type { Task, TaskStatus, TaskPriority, TaskSource } from "@/lib/types";
import { COLUMNS, TEAM_MEMBERS, JIAFANG_SOURCES } from "@/lib/types";
import { IconX } from "@/components/Icons";
import { getInitials, getAssigneeColor } from "@/utils";
import styles from "./TaskModal.module.css";

interface TaskModalProps {
  task: Partial<Task> & { status?: TaskStatus };
  onSave: (task: Omit<Task, "id" | "created" | "updated">) => void;
  onClose: () => void;
}

export default function TaskModal({ task, onSave, onClose }: TaskModalProps) {
  const isNew = !task.id;
  const [form, setForm] = useState({
    title: task.title || "",
    desc: task.desc || "",
    status: (task.status || "todo") as TaskStatus,
    priority: (task.priority || "medium") as TaskPriority,
    source: (task.source || "internal") as TaskSource,
    requester: task.requester || "",
    assignees: task.assignees || ([] as string[]),
    due: task.due || "",
  });

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
      due: form.due || null,
    });
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.head}>
          <h2 className={styles.title}>{isNew ? "新建任务" : "编辑任务"}</h2>
          <button className={styles.close} onClick={onClose}>
            <IconX />
          </button>
        </div>
        <div className={styles.body}>
          <div className={styles.row}>
            <label className={styles.label}>任务标题 *</label>
            <input
              className={styles.input}
              placeholder="简要描述任务内容"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
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
              rows={3}
            />
          </div>
          <div className={styles.rowInline}>
            <div className={styles.row}>
              <label className={styles.label}>状态</label>
              <select
                className={styles.input}
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.row}>
              <label className={styles.label}>优先级</label>
              <select
                className={styles.input}
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
              >
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
                  onClick={() => set("source", src)}
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
                    onClick={() => set("requester", form.requester === src ? "" : src)}
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
              {TEAM_MEMBERS.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`${styles.assigneeChip} ${form.assignees.includes(name) ? styles.assigneeChipSelected : ""}`}
                  onClick={() => toggleAssignee(name)}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: getAssigneeColor(name),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      color: "white",
                      fontWeight: 700,
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
            <input
              className={styles.input}
              type="date"
              value={form.due}
              onChange={(e) => set("due", e.target.value)}
            />
          </div>
        </div>
        <div className={styles.foot}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>
            取消
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSave}>
            {isNew ? "创建任务" : "保存修改"}
          </button>
        </div>
      </div>
    </div>
  );
}
