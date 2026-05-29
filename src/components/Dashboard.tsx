"use client";

import type { Task, TaskStatus, TaskPriority, TaskSource } from "@/lib/types";
import StatCard from "@/components/StatCard/StatCard";
import ProgressBar from "@/components/ProgressBar/ProgressBar";
import { IconDownload } from "@/components/Icons";
import { getInitials, getAssigneeColor, formatDate, exportToExcel } from "@/utils";
import styles from "./Dashboard.module.css";

const statusMap: Record<TaskStatus, string> = {
  todo: "待办", inprogress: "进行中", review: "审核中", blocked: "已阻塞", done: "已完成",
};
const priorityMap: Record<TaskPriority, string> = { high: "高", medium: "中", low: "低" };
const sourceMap: Record<TaskSource, string> = { jiafang: "甲方", internal: "内部" };
const statusColor: Record<TaskStatus, string> = {
  todo: "var(--meta)", inprogress: "var(--accent)", review: "var(--warn)", blocked: "var(--danger)", done: "var(--success)",
};

interface DashboardProps {
  tasks: Task[];
}

export default function Dashboard({ tasks }: DashboardProps) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const inprogress = tasks.filter((t) => t.status === "inprogress").length;
  const blocked = tasks.filter((t) => t.status === "blocked").length;
  const jiafang = tasks.filter((t) => t.source === "jiafang").length;
  const jiafangDone = tasks.filter((t) => t.source === "jiafang" && t.status === "done").length;
  const internal = tasks.filter((t) => t.source === "internal").length;
  const internalDone = tasks.filter((t) => t.source === "internal" && t.status === "done").length;
  const completion = total > 0 ? Math.round((done / total) * 100) : 0;
  const jiafangPct = jiafang > 0 ? Math.round((jiafangDone / jiafang) * 100) : 0;
  const internalPct = internal > 0 ? Math.round((internalDone / internal) * 100) : 0;

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>项目全局概览</h1>
          <p className={styles.sub}>智慧运维管理平台 V3 · 数据更新于 {new Date().toLocaleDateString("zh-CN")}</p>
        </div>
      </div>

      <div className={styles.stats}>
        <StatCard label="总任务数" value={total} change="全部任务" changeType="neutral" colorIndex={0} />
        <StatCard
          label="完成率"
          value={<>{completion}<span>%</span></>}
          change={`已完成 ${done} 项任务`}
          changeType="up"
          colorIndex={1}
        />
        <StatCard label="进行中" value={inprogress} change="项任务推进中" changeType="neutral" colorIndex={2} />
        <StatCard
          label="已阻塞"
          value={blocked}
          change={blocked > 0 ? `需关注 ${blocked} 项阻塞` : "无阻塞项"}
          changeType={blocked > 0 ? "warn" : "neutral"}
          colorIndex={3}
        />
      </div>

      <div className={styles.grid}>
        <div className={styles.section}>
          <div className={styles.secHead}>
            <span className={styles.secTitle}>任务清单</span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)" }}>{total} 个任务</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>任务</th>
                  <th>状态</th>
                  <th>优先级</th>
                  <th>来源</th>
                  <th>负责人</th>
                  <th>截止</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td className={styles.tdTitle}>
                      <div className={styles.tdTitleInner}>{t.title}</div>
                    </td>
                    <td>
                      <span className={styles.statusDot} style={{ background: statusColor[t.status] }} />
                      {statusMap[t.status]}
                    </td>
                    <td>
                      <span className={`${styles.priorityBadge} ${styles[`pb_${t.priority}`]}`}>
                        {priorityMap[t.priority]}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.sourceBadge} ${styles[`sb_${t.source}`]}`}>
                        {sourceMap[t.source]}{t.requester ? ` · ${t.requester}` : ""}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex" }}>
                        {t.assignees.slice(0, 2).map((a, i) => (
                          <div
                            key={a}
                            className={styles.assigneeMini}
                            style={{ background: getAssigneeColor(a), marginLeft: i > 0 ? -5 : 0 }}
                            title={a}
                          >
                            {getInitials(a)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: "var(--text-xs)" }}>{formatDate(t.due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.sideCol}>
          <div className={styles.section}>
            <div className={styles.secHead}>
              <span className={styles.secTitle}>完成进度</span>
            </div>
            <ProgressBar label="甲方任务" percent={jiafangPct} color="var(--accent)" detail={`甲方 ${jiafangDone}/${jiafang} · 内部 ${internalDone}/${internal}`} />
            <ProgressBar label="内部任务" percent={internalPct} color="var(--success)" detail="" />
          </div>

          <div className={styles.section}>
            <div className={styles.secHead}>
              <span className={styles.secTitle}>导出汇报</span>
            </div>
            <div className={styles.exportBar}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
                <div className={styles.exportIcon}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--success)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 2v11M5 8l5 5 5-5M3 16v2h14v-2" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>Excel / CSV 导出</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)" }}>适合发给老板的列表格式</div>
                </div>
              </div>
              <p className={styles.exportDesc}>导出当前所有任务的完整列表，包含状态、优先级、来源、负责人、截止日期等信息，可直接用 Excel 打开。</p>
              <button className={styles.exportBtn} onClick={() => exportToExcel(tasks)}>
                <IconDownload /> 导出 CSV 文件
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
