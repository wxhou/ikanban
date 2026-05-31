"use client";

import { memo, useMemo } from "react";
import type { Task, TaskStatus, TaskPriority, TaskSource } from "@/lib/types";
import { COLUMNS } from "@/lib/types";
import StatCard from "@/components/StatCard/StatCard";
import { IconWarning } from "@/components/Icons";
import { getInitials, getAssigneeColor, formatDate, isOverdue, overdueDays } from "@/utils";
import styles from "./Dashboard.module.css";

const statusMap: Record<TaskStatus, string> = {
  todo: "待办", inprogress: "进行中", review: "审核中", verifying: "待验收", blocked: "已阻塞", done: "已完成",
};
const priorityMap: Record<TaskPriority, string> = { high: "高", medium: "中", low: "低" };
const sourceMap: Record<TaskSource, string> = { jiafang: "甲方", internal: "内部" };
const statusColor: Record<TaskStatus, string> = {
  todo: "var(--meta)", inprogress: "var(--accent)", review: "var(--warn)", verifying: "#7c3aed", blocked: "var(--danger)", done: "var(--success)",
};

interface DashboardProps {
  tasks: Task[];
  members?: string[];
}

const Dashboard = memo(function Dashboard({ tasks, members = [] }: DashboardProps) {
  const { total, done, inprogress, blocked, overdue, completion, maxColCount } = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const inprogress = tasks.filter((t) => t.status === "inprogress").length;
    const blocked = tasks.filter((t) => t.status === "blocked").length;
    const overdue = tasks.filter((t) => isOverdue(t));
    const completion = total > 0 ? Math.round((done / total) * 100) : 0;
    const maxColCount = Math.max(...COLUMNS.map((c) => tasks.filter((t) => t.status === c.id).length), 1);
    return { total, done, inprogress, blocked, overdue, completion, maxColCount };
  }, [tasks]);

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
        <StatCard
          label="已逾期"
          value={overdue.length}
          change={overdue.length > 0 ? "需立即处理" : "无逾期任务"}
          changeType={overdue.length > 0 ? "warn" : "neutral"}
          colorIndex={4}
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
              <span className={styles.secTitle}><IconWarning /> 逾期任务预警</span>
              {overdue.length > 0 && <span style={{ fontSize: "var(--text-xs)", color: "var(--danger)", fontWeight: 600 }}>{overdue.length} 项</span>}
            </div>
            {overdue.length === 0 ? (
              <div className={styles.overdueEmpty}>暂无逾期任务</div>
            ) : (
              <div className={styles.overdueList}>
                {[...overdue].sort((a, b) => overdueDays(b.due) - overdueDays(a.due)).map((t) => {
                  const col = COLUMNS.find((c) => c.id === t.status);
                  const days = overdueDays(t.due);
                  return (
                    <div key={t.id} className={styles.overdueItem}>
                      <div className={styles.overdueItemTitle}>
                        <span>{t.title}</span>
                        <span className={styles.overdueDays}>逾期 {days} 天</span>
                      </div>
                      <div className={styles.overdueMeta}>
                        {col?.label} · {t.assignees.join(", ") || "未分配"} · 截止 {t.due}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <div className={styles.secHead}>
              <span className={styles.secTitle}>列分布</span>
            </div>
            <div className={styles.panelBody}>
              {COLUMNS.map((col) => {
                const ct = tasks.filter((t) => t.status === col.id).length;
                const pct = Math.round((ct / maxColCount) * 100);
                return (
                  <div key={col.id} className={styles.colBarItem}>
                    <div className={styles.colBarHeader}>
                      <span className={styles.colBarName}>
                        <span className={styles.colBarDot} style={{ background: statusColor[col.id] }} />
                        {col.label}
                      </span>
                      <span className={styles.colBarCount}>{ct}</span>
                    </div>
                    <div className={styles.colBarTrack}>
                      <div className={styles.colBarFill} style={{ width: `${pct}%`, background: statusColor[col.id] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.secHead}>
              <span className={styles.secTitle}>人员负载</span>
            </div>
            <div className={styles.panelBody}>
              {members.map((mem) => {
                const memTasks = tasks.filter((t) => t.assignees.includes(mem));
                const memTotal = memTasks.length;
                const memActive = memTasks.filter((t) => t.status === "inprogress" || t.status === "review").length;
                const loadPct = memTotal > 0 ? Math.round((memActive / memTotal) * 100) : 0;
                const barColor = loadPct >= 70 ? "var(--danger)" : loadPct >= 40 ? "var(--warn)" : "var(--success)";
                return (
                  <div key={mem} className={styles.teamRow}>
                    <div className={styles.teamAvatar} style={{ background: getAssigneeColor(mem) }}>{getInitials(mem)}</div>
                    <div className={styles.teamInfo}>
                      <div className={styles.teamName}>
                        {mem}
                        <span className={styles.teamCount}>{memTotal > 0 ? `${memTotal} 个任务` : "暂无任务"}</span>
                      </div>
                      {memTotal > 0 && (
                        <div className={styles.teamBarWrap}>
                          <div className={styles.teamBarFill} style={{ width: `${loadPct}%`, background: barColor }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
      </div>
    </div>
    </div>
  );
});

export default Dashboard;
