"use client";

import type { Task, TaskStatus, TaskPriority, TaskSource } from "@/lib/types";
import { COLUMNS } from "@/lib/types";
import { IconDownload } from "@/components/Icons";
import { isOverdue, overdueDays, exportToExcel } from "@/utils";
import styles from "./Report.module.css";

const statusMap: Record<TaskStatus, string> = {
  todo: "待办", inprogress: "进行中", review: "审核中", verifying: "待验收", blocked: "已阻塞", done: "已完成",
};
const priorityMap: Record<TaskPriority, string> = { high: "高", medium: "中", low: "低" };
const sourceMap: Record<TaskSource, string> = { jiafang: "甲方", internal: "内部" };
const statusColor: Record<TaskStatus, string> = {
  todo: "var(--meta)", inprogress: "var(--accent)", review: "var(--warn)", verifying: "#7c3aed", blocked: "var(--danger)", done: "var(--success)",
};

interface ReportProps {
  tasks: Task[];
}

export default function Report({ tasks }: ReportProps) {
  return (
    <div className={styles.report}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>任务汇报</h1>
          <p className={styles.sub}>{tasks.length} 个任务 · {new Date().toLocaleDateString("zh-CN")}</p>
        </div>
        <button className={styles.exportBtn} onClick={() => exportToExcel(tasks)}>
          <IconDownload /> 导出 CSV
        </button>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>任务名称</th>
              <th>来源</th>
              <th>优先级</th>
              <th>状态</th>
              <th>负责人</th>
              <th>截止日期</th>
              <th>子任务</th>
              <th>评论</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, i) => {
              const col = COLUMNS.find((c) => c.id === t.status);
              const overdue = isOverdue(t);
              const subs = t.subtasks || [];
              const subDone = subs.filter((s) => s.done).length;
              const subTotal = subs.length;
              const commentCount = (t.comments || []).length;
              const days = overdue ? overdueDays(t.due) : 0;

              return (
                <tr key={t.id} className={overdue ? styles.overdueRow : ""}>
                  <td className={styles.cellNum}>{i + 1}</td>
                  <td className={styles.cellTitle}>
                    <span>{t.title}</span>
                    {overdue && <span className={styles.overdueBadge}>逾期 {days} 天</span>}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${t.source === "jiafang" ? styles.badgeJiafang : styles.badgeInternal}`}>
                      {sourceMap[t.source]}{t.requester ? ` · ${t.requester}` : ""}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.priorityBadge} ${styles[`pb_${t.priority}`]}`}>
                      {priorityMap[t.priority]}
                    </span>
                  </td>
                  <td>
                    <span className={styles.statusDot} style={{ background: statusColor[t.status] }} />
                    {col?.label}
                  </td>
                  <td className={styles.cellMuted}>{t.assignees.join(", ") || "—"}</td>
                  <td className={`${styles.cellMuted} ${overdue ? styles.cellDanger : ""}`}>{t.due || "—"}</td>
                  <td className={styles.cellMuted}>
                    {subTotal > 0 ? (
                      <span className={styles.subtaskCell}>
                        {subDone}/{subTotal}
                        <span className={styles.miniBar}>
                          <span className={styles.miniBarFill} style={{ width: `${Math.round((subDone / subTotal) * 100)}%` }} />
                        </span>
                      </span>
                    ) : "—"}
                  </td>
                  <td className={styles.cellMuted}>{commentCount > 0 ? `${commentCount} 条` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
