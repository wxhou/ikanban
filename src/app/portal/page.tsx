"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Task, Version, TaskStatus, Notification } from "@/lib/types";
import { COLUMNS } from "@/lib/types";
import { formatDate, getAssigneeColor, isOverdue, overdueDays } from "@/utils";
import styles from "./page.module.css";

const statusMap: Record<TaskStatus, string> = {
  todo: "待办", inprogress: "进行中", review: "审核中", verifying: "待验收", blocked: "已阻塞", done: "已完成",
};
const statusColor: Record<TaskStatus, string> = {
  todo: "var(--meta)", inprogress: "var(--accent)", review: "var(--warn)", verifying: "#7c3aed", blocked: "var(--danger)", done: "var(--success)",
};
const priorityMap: Record<string, string> = { high: "高", medium: "中", low: "低" };

export default function PortalPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Set<number>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [portalNotifications, setPortalNotifications] = useState<Notification[]>([]);
  const [unreadPortalNotifs, setUnreadPortalNotifs] = useState(0);
  const [showNotifList, setShowNotifList] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auth gate — resolve session via /api/auth/me; the `sid` cookie auto-flows.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setUserName(data.name);
        }
      } catch {
        /* network error; treated as not logged in below */
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authChecked && !userName) {
      window.location.href = "/";
    }
  }, [authChecked, userName]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v");
    const a = params.get("a");
    const d = params.get("d");
    const ds = params.get("ds");
    const de = params.get("de");
    if (a) setAssigneeFilter(a);
    if (d) setDateRange(d);
    if (ds) setDateRangeStart(ds);
    if (de) setDateRangeEnd(de);
    if (v) {
      const vid = Number(v);
      if (!isNaN(vid)) setSelectedVersionId(vid);
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(async () => {
      if (document.hidden) return;
      setIsRefreshing(true);
      try {
        const res = await fetch("/api/portal/tasks");
        if (res.ok) {
          const data = await res.json();
          setTasks(Array.isArray(data) ? data : data.tasks || []);
        }
      } catch (e) {
        console.warn("Portal polling failed:", e);
      } finally {
        setIsRefreshing(false);
      }
    }, 15_000);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } else {
        startPolling();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    startPolling();
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [startPolling]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setPortalNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadPortalNotifs(typeof data.unread === "number" ? data.unread : 0);
    } catch (e) {
      console.warn("Portal notification poll failed:", e);
    }
  }, []);

  useEffect(() => {
    if (!authChecked || !userName) return;
    const startNotifPolling = () => {
      if (notifPollingRef.current) return;
      const tick = async () => {
        if (document.hidden) return;
        await fetchNotifications();
      };
      void tick();
      notifPollingRef.current = setInterval(tick, 30_000);
    };
    const stopNotifPolling = () => {
      if (notifPollingRef.current) {
        clearInterval(notifPollingRef.current);
        notifPollingRef.current = null;
      }
    };
    const handleVisibility = () => {
      if (document.hidden) stopNotifPolling();
      else startNotifPolling();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    startNotifPolling();
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      stopNotifPolling();
    };
  }, [authChecked, userName, fetchNotifications]);

  useEffect(() => {
    if (!authChecked || !userName) return;
    Promise.all([
      fetch("/api/portal/tasks").then((r) => r.json()),
      fetch("/api/portal/versions").then((r) => r.json()),
    ]).then(([t, v]) => {
      setTasks(t);
      setVersions(v);
      const params = new URLSearchParams(window.location.search);
      if (!params.get("v")) {
        const active = v.find((ver: Version) => ver.status === "active");
        if (active) setSelectedVersionId(active.id);
      }
      setLoading(false);
    });
    fetch("/api/assignees")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAssignees(data); })
      .catch(() => {});
  }, [authChecked, userName]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedVersionId) params.set("v", String(selectedVersionId));
    if (assigneeFilter) params.set("a", assigneeFilter);
    if (dateRange) params.set("d", dateRange);
    if (dateRange === "custom") {
      if (dateRangeStart) params.set("ds", dateRangeStart);
      if (dateRangeEnd) params.set("de", dateRangeEnd);
    }
    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [selectedVersionId, assigneeFilter, dateRange, dateRangeStart, dateRangeEnd]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedVersionId && t.versionId !== selectedVersionId) return false;
      if (assigneeFilter && (!t.assignees || !t.assignees.includes(assigneeFilter))) return false;
      if (dateRange) {
        const taskDate = new Date(t.created);
        const now = new Date();
        switch (dateRange) {
          case "today": if (t.created.slice(0, 10) !== now.toISOString().slice(0, 10)) return false; break;
          case "week": { const d = new Date(now); d.setDate(d.getDate() - 7); if (taskDate < d) return false; break; }
          case "month": { const d = new Date(now); d.setMonth(d.getMonth() - 1); if (taskDate < d) return false; break; }
          case "custom": {
            if (dateRangeStart && t.created.slice(0, 10) < dateRangeStart) return false;
            if (dateRangeEnd && t.created.slice(0, 10) > dateRangeEnd) return false;
            break;
          }
        }
      }
      return true;
    });
  }, [tasks, selectedVersionId, assigneeFilter, dateRange, dateRangeStart, dateRangeEnd]);

  const activeTasks = filtered.filter((t) => t.status !== "done");
  const deliveredTasks = filtered.filter((t) => t.status === "done");
  const totalCount = filtered.length;
  const deliveredCount = deliveredTasks.length;
  const blockedCount = filtered.filter((t) => t.status === "blocked").length;
  const inProgressCount = filtered.filter((t) => t.status === "inprogress").length;
  const overdueCount = activeTasks.filter((t) => isOverdue(t)).length;
  const reviewingCount = filtered.filter((t) => t.status === "review").length;
  const progressPct = totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 0;

  const toggleComments = (taskId: number) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
  };

  const handleCommentSubmit = useCallback(async (taskId: number) => {
    const text = commentInputs[taskId]?.trim();
    if (!text) return;
    setSubmittingComment((prev) => new Set(prev).add(taskId));
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: userName || "客户", text }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, comments: [...(t.comments || []), newComment] } : t
          )
        );
        setCommentInputs((prev) => ({ ...prev, [taskId]: "" }));
      }
    } finally {
      setSubmittingComment((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, [commentInputs]);

  const maxColCount = Math.max(...COLUMNS.map((c) => filtered.filter((t) => t.status === c.id).length), 1);

  if (loading || !authChecked) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className={styles.portal}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>项目交付看板</h1>
          <p className={styles.sub}>
            {versions.find((v) => v.id === selectedVersionId)?.name || "全部版本"}
            {" · "}更新于 {new Date().toLocaleDateString("zh-CN")}
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.notifWrap}>
            <button
              type="button"
              className={styles.bellBtn}
              aria-label="通知"
              onClick={() => setShowNotifList((v) => !v)}
            >
              <span className={styles.bellIcon}>🔔</span>
              {unreadPortalNotifs > 0 && (
                <span className={styles.badge}>{unreadPortalNotifs}</span>
              )}
            </button>
            {showNotifList && (
              <div className={styles.notifPopover}>
                <div className={styles.notifHeader}>
                  待我验收 {unreadPortalNotifs}
                </div>
                {portalNotifications.length === 0 ? (
                  <div className={styles.notifEmpty}>暂无通知</div>
                ) : (
                  <ul className={styles.notifList}>
                    {portalNotifications.map((n) => (
                      <li key={n.id} className={styles.notifItem}>
                        <span className={styles.notifText}>{n.text}</span>
                        <span className={styles.notifTime}>
                          {new Date(n.created).toLocaleString("zh-CN", { hour12: false })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <select
            className={styles.versionSelect}
            value={selectedVersionId ?? ""}
            onChange={(e) => setSelectedVersionId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">全部版本</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}{v.status === "active" ? " · 当前" : ""}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className={styles.filterRow}>
        <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className={styles.filterSelect}>
          <option value="">全部负责人</option>
          {assignees.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className={styles.filterSelect}>
          <option value="">全部时间</option>
          <option value="today">今天</option>
          <option value="week">本周</option>
          <option value="month">本月</option>
          <option value="custom">自定义</option>
        </select>
        {dateRange === "custom" && (
          <>
            <input type="date" value={dateRangeStart} onChange={(e) => setDateRangeStart(e.target.value)} className={styles.dateInput} />
            <span>~</span>
            <input type="date" value={dateRangeEnd} onChange={(e) => setDateRangeEnd(e.target.value)} className={styles.dateInput} />
          </>
        )}
        {isRefreshing && <span className={styles.refreshIndicator}>⟳</span>}
        <a
          className={styles.exportBtn}
          href={`/api/portal/export${(() => {
            const params = new URLSearchParams();
            if (selectedVersionId) params.set("v", String(selectedVersionId));
            if (assigneeFilter) params.set("a", assigneeFilter);
            if (dateRangeStart) params.set("from", dateRangeStart);
            if (dateRangeEnd) params.set("to", dateRangeEnd);
            const qs = params.toString();
            return qs ? `?${qs}` : "";
          })()}`}
          download
        >
          导出 CSV
        </a>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalCount}</span>
          <span className={styles.statLabel}>总任务</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: "var(--success)" }}>{deliveredCount}</span>
          <span className={styles.statLabel}>已交付</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: "var(--accent)" }}>{inProgressCount}</span>
          <span className={styles.statLabel}>进行中</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: "#7c3aed" }}>{reviewingCount}</span>
          <span className={styles.statLabel}>审核中</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: blockedCount > 0 ? "var(--danger)" : "var(--muted)" }}>{blockedCount}</span>
          <span className={styles.statLabel}>已阻塞</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: overdueCount > 0 ? "var(--danger)" : "var(--muted)" }}>{overdueCount}</span>
          <span className={styles.statLabel}>已逾期</span>
        </div>
      </div>

      {/* Main content: Active tasks table + Sidebar */}
      <div className={styles.mainGrid}>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>进行中任务</h2>
            <span className={styles.cardCount}>{activeTasks.length} 项</span>
          </div>
          {activeTasks.length === 0 ? (
            <p className={styles.empty}>暂无进行中的任务</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: "35%" }}>任务名称</th>
                    <th style={{ width: "10%" }}>状态</th>
                    <th style={{ width: "6%" }}>优先级</th>
                    <th style={{ width: "16%" }}>负责人</th>
                    <th style={{ width: "12%" }}>截止日期</th>
                    <th style={{ width: "8%" }}>评论</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTasks.map((task) => {
                    const overdue = isOverdue(task);
                    return (
                      <TaskRow
                        key={task.id}
                        task={task}
                        overdue={overdue}
                        expandedComments={expandedComments}
                        commentInput={commentInputs[task.id] || ""}
                        submitting={submittingComment.has(task.id)}
                        onToggleComments={toggleComments}
                        onCommentChange={(v) => setCommentInputs((prev) => ({ ...prev, [task.id]: v }))}
                        onCommentSubmit={handleCommentSubmit}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          {/* Progress */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>交付进度</h2>
            </div>
            <div className={styles.progressBody}>
              <div className={styles.progressRing}>
                <svg viewBox="0 0 100 100" className={styles.ringSvg}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none" stroke="var(--success)"
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${progressPct * 2.639} 263.9`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className={styles.ringLabel}>
                  <span className={styles.ringPct}>{progressPct}%</span>
                </div>
              </div>
              <div className={styles.progressNums}>
                <span>{deliveredCount}/{totalCount} 已交付</span>
              </div>
            </div>
          </section>

          {/* Status distribution */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>状态分布</h2>
            </div>
            <div className={styles.distBody}>
              {COLUMNS.map((col) => {
                const ct = filtered.filter((t) => t.status === col.id).length;
                const pct = maxColCount > 0 ? Math.round((ct / maxColCount) * 100) : 0;
                return (
                  <div key={col.id} className={styles.distItem}>
                    <div className={styles.distHeader}>
                      <span className={styles.distDot} style={{ background: statusColor[col.id] }} />
                      <span className={styles.distLabel}>{col.label}</span>
                      <span className={styles.distCount}>{ct}</span>
                    </div>
                    <div className={styles.distBar}>
                      <div className={styles.distFill} style={{ width: `${pct}%`, background: statusColor[col.id] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recent comments */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>近期评论</h2>
            </div>
            <div className={styles.recentComments}>
              {filtered.flatMap((t) => (t.comments || []).map((c) => ({ ...c, taskTitle: t.title, taskId: t.id })))
                .sort((a, b) => b.created.localeCompare(a.created))
                .slice(0, 8)
                .map((c, i) => (
                  <div key={`${c.taskId}-${c.id}`} className={styles.recentCommentItem}>
                    <span className={styles.rcUser}>{c.user}</span>
                    <span className={styles.rcText}>{c.text}</span>
                    <span className={styles.rcTask}>— {c.taskTitle}</span>
                  </div>
                ))}
              {filtered.flatMap((t) => t.comments || []).length === 0 && (
                <p className={styles.empty}>暂无评论</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Delivered tasks */}
      {deliveredTasks.length > 0 && (
        <section className={styles.card} style={{ marginTop: "var(--space-5)" }}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>已交付任务</h2>
            <span className={styles.cardCount}>{deliveredCount} 项</span>
          </div>
          <div className={styles.deliveredGrid}>
            {deliveredTasks.map((task) => (
              <div key={task.id} className={styles.deliveredCard}>
                <span className={styles.deliveredCardTitle}>{task.title}</span>
                <div className={styles.deliveredCardMeta}>
                  <span>{task.assignees.join(", ") || "未分配"}</span>
                  <span>{formatDate(task.due)} 截止</span>
                </div>
                {task.requester && (
                  <span className={styles.deliveredRequester}>{task.requester}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TaskRow({
  task, overdue, expandedComments, commentInput, submitting,
  onToggleComments, onCommentChange, onCommentSubmit,
}: {
  task: Task;
  overdue: boolean;
  expandedComments: Set<number>;
  commentInput: string;
  submitting: boolean;
  onToggleComments: (id: number) => void;
  onCommentChange: (v: string) => void;
  onCommentSubmit: (id: number) => void;
}) {
  const showComments = expandedComments.has(task.id);
  const comments = task.comments || [];
  const days = overdue ? overdueDays(task.due) : 0;

  return (
    <>
      <tr className={overdue ? styles.overdueRow : ""}>
        <td>
          <div className={styles.taskCell}>
            <span className={styles.taskName}>{task.title}</span>
            {overdue && <span className={styles.overdueBadge}>逾期 {days} 天</span>}
            {task.desc && <span className={styles.taskDesc}>{task.desc}</span>}
          </div>
        </td>
        <td>
          <span className={styles.statusBadge} style={{ background: statusColor[task.status] }}>
            {statusMap[task.status]}
          </span>
        </td>
        <td>
          <span className={`${styles.priorityTag} ${styles[`p_${task.priority}`]}`}>
            {priorityMap[task.priority]}
          </span>
        </td>
        <td>
          <div className={styles.assigneeCol}>
            {task.assignees.length > 0
              ? task.assignees.map((a) => (
                  <span key={a} className={styles.assigneeChip} style={{ background: getAssigneeColor(a) }}>
                    {a}
                  </span>
                ))
              : <span className={styles.muted}>—</span>}
          </div>
        </td>
        <td className={`${styles.dueCell} ${overdue ? styles.dueOverdue : ""}`}>
          {formatDate(task.due)}
        </td>
        <td>
          <button className={styles.commentBtn} onClick={() => onToggleComments(task.id)}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 2h12v8H5.5L3 12V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            {comments.length > 0 && <span>{comments.length}</span>}
          </button>
        </td>
      </tr>
      {showComments && (
        <tr>
          <td colSpan={6} className={styles.commentCell}>
            <div className={styles.commentPanel}>
              {comments.map((c) => (
                <div key={c.id} className={styles.commentItem}>
                  <span className={styles.commentUser}>{c.user}</span>
                  <span className={styles.commentText}>{c.text}</span>
                  <span className={styles.commentTime}>{c.created.slice(5, 16)}</span>
                </div>
              ))}
              <div className={styles.commentInputRow}>
                <input
                  className={styles.commentInput}
                  placeholder="输入评论后回车发送..."
                  value={commentInput}
                  onChange={(e) => onCommentChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !submitting) onCommentSubmit(task.id);
                  }}
                />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
