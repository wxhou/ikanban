"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { Task, TaskStatus, Version } from "@/lib/types";
import { COLUMNS } from "@/lib/types";
import { useToast } from "@/lib/toast-context";
import FilterBar from "@/components/FilterBar/FilterBar";
import KanbanColumn from "@/components/KanbanColumn/KanbanColumn";
import { fetchTasks, updateTask, createTask } from "@/api";
import styles from "./KanbanBoard.module.css";

interface KanbanBoardProps {
  initialTasks: Task[];
  onEditTask: (task: Task) => void;
  onViewTask: (task: Task) => void;
  onTasksChange: (tasks: Task[]) => void;
  versions: Version[];
  activeVersionId: number | null;
  onVersionChange: (id: number | null) => void;
  readonly: boolean;
  currentUser: string;
  showJiafangFilter?: boolean;
  modalTask?: Task | null;
}

export default function KanbanBoard({ initialTasks: tasks, onEditTask, onViewTask, onTasksChange, versions, activeVersionId, onVersionChange, readonly, currentUser, showJiafangFilter = true, modalTask = null }: KanbanBoardProps) {
  const [filter, setFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "priority" | "due">("default");
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const prevStatusRef = useRef<{ taskId: number; oldStatus: TaskStatus } | null>(null);
  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);
  const toast = useToast();

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isModalOpenRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [assignees, setAssignees] = useState<string[]>([]);

  useEffect(() => {
    isModalOpenRef.current = modalTask != null;
  }, [modalTask]);

  useEffect(() => {
    fetch("/api/assignees")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAssignees(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // URL is the source of truth on mount; lazy init would cause SSR hydration mismatch.
    /* eslint-disable react-hooks/set-state-in-effect */
    const params = new URLSearchParams(window.location.search);
    const f = params.get("f");
    const p = params.get("p");
    const q = params.get("q");
    if (f) setFilter(f);
    if (p) setPriorityFilter(p);
    if (q) setSearch(q);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("f", filter);
    if (priorityFilter !== "all") params.set("p", priorityFilter);
    if (search) params.set("q", search);
    if (activeVersionId != null) params.set("v", String(activeVersionId));
    if (assigneeFilter) params.set("a", assigneeFilter);
    if (dateRange) params.set("d", dateRange);
    if (dateRange === "custom") {
      if (dateRangeStart) params.set("ds", dateRangeStart);
      if (dateRangeEnd) params.set("de", dateRangeEnd);
    }
    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [filter, priorityFilter, search, activeVersionId, assigneeFilter, dateRange, dateRangeStart, dateRangeEnd]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(async () => {
      if (document.hidden) return;
      if (isModalOpenRef.current) return;
      setIsRefreshing(true);
      try {
        const fresh = await fetchTasks();
        if (Array.isArray(fresh)) {
          onTasksChange(fresh);
        }
      } catch (e) {
        console.warn("Polling refresh failed:", e);
      } finally {
        setIsRefreshing(false);
      }
    }, 30_000);
  }, [onTasksChange]);

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

  const filtered = useMemo(() => {
    const base = tasks
      .filter((t) => {
        if (filter === "jiafang") return t.source === "jiafang";
        if (filter === "internal") return t.source === "internal";
        if (filter === "mine") return t.assignees.includes(currentUser);
        return true;
      })
      .filter((t) => {
        if (priorityFilter === "all") return true;
        return t.priority === priorityFilter;
      })
      .filter((t) => {
        if (activeVersionId === null) return true;
        if (activeVersionId === 0) return t.versionId === null;
        return t.versionId === activeVersionId;
      })
      .filter((t) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          (t.desc && t.desc.toLowerCase().includes(q)) ||
          (t.requester && t.requester.includes(q)) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          t.comments.some((c) => c.text.toLowerCase().includes(q))
        );
      })
      .filter((t) => !assigneeFilter || (t.assignees && t.assignees.includes(assigneeFilter)))
      .filter((t) => {
        if (!dateRange) return true;
        const taskDate = new Date(t.created);
        const now = new Date();
        switch (dateRange) {
          case "today": return t.created.slice(0, 10) === now.toISOString().slice(0, 10);
          case "week": {
            const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
            return taskDate >= weekAgo;
          }
          case "month": {
            const monthAgo = new Date(now); monthAgo.setMonth(monthAgo.getMonth() - 1);
            return taskDate >= monthAgo;
          }
          case "custom": {
            if (dateRangeStart && t.created.slice(0, 10) < dateRangeStart) return false;
            if (dateRangeEnd && t.created.slice(0, 10) > dateRangeEnd) return false;
            return true;
          }
          default: return true;
        }
      });
    const result = [...base].sort((a, b) => {
      if (sortBy === "priority") {
        const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
      }
      if (sortBy === "due") {
        if (!a.due) return 1;
        if (!b.due) return -1;
        return a.due.localeCompare(b.due);
      }
      return 0;
    });
    return result;
  }, [tasks, filter, priorityFilter, search, sortBy, activeVersionId, assigneeFilter, dateRange, dateRangeStart, dateRangeEnd]);

  const tasksByStatus = useMemo(() => {
    const map: Record<string, Task[]> = {};
    COLUMNS.forEach((c) => {
      map[c.id] = filtered.filter((t) => t.status === c.id);
    });
    return map;
  }, [filtered]);

  const handleDragStart = useCallback((id: number) => {
    setDragId(id);
  }, []);
  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setDragOverId(null);
  }, []);
  const handleDragOver = useCallback((id: number) => {
    setDragOverId(id);
  }, []);

  const handleDrop = useCallback(
    async (targetStatus: TaskStatus, targetTaskId?: number) => {
      const currentDragId = dragId;
      if (!currentDragId) return;

      const draggedTask = tasks.find((t) => t.id === currentDragId);
      if (!draggedTask) return;

      const prevStatus = draggedTask.status;
      if (prevStatus === targetStatus && !targetTaskId) return;

      let newTasks: Task[];

      if (draggedTask.status === targetStatus && targetTaskId && targetTaskId !== currentDragId) {
        const sameCol = tasks.filter((t) => t.status === targetStatus);
        const others = tasks.filter((t) => t.status !== targetStatus);
        const dragIdx = sameCol.findIndex((t) => t.id === currentDragId);
        const [moved] = sameCol.splice(dragIdx, 1);
        const targetIdx = sameCol.findIndex((t) => t.id === targetTaskId);
        sameCol.splice(targetIdx, 0, moved);
        newTasks = [...others, ...sameCol];
      } else {
        newTasks = tasks.map((t) =>
          t.id === currentDragId ? { ...t, status: targetStatus } : t,
        );
      }

      onTasksChange(newTasks);

      try {
        await updateTask(currentDragId, { status: targetStatus });
        const colLabel = COLUMNS.find((c) => c.id === targetStatus)?.label || targetStatus;
        toast.show(`已移至「${colLabel}」`, "success", {
          label: "撤销",
          onClick: async () => {
            const reverted = tasksRef.current.map((t) =>
              t.id === currentDragId ? { ...t, status: prevStatus } : t,
            );
            onTasksChange(reverted);
            try { await updateTask(currentDragId, { status: prevStatus }); } catch (err) { console.error("Failed to revert drag:", err); }
          },
        });
      } catch (err) {
        console.error("Failed to move task:", err);
        onTasksChange(tasksRef.current);
        toast.show("移动失败，请重试", "error");
      }
      setDragId(null);
      setDragOverId(null);
    },
    [tasks, onTasksChange, toast, dragId],
  );

  const handleCommentAdded = useCallback(async () => {
    fetchTasks().then(onTasksChange).catch(console.error);
  }, [onTasksChange]);

  const handleQuickAdd = useCallback(async (title: string, status: TaskStatus) => {
    const created = await createTask({
      title,
      status,
      priority: "medium",
      source: "internal",
      assignees: [currentUser],
      tags: [],
      due: "",
      desc: "",
      requester: "",
      versionId: activeVersionId,
    } as Parameters<typeof createTask>[0]);
    const newTasks = [...tasks, created];
    onTasksChange(newTasks);
    toast.show(`任务「${title}」已创建`, "success");
  }, [tasks, onTasksChange, currentUser, activeVersionId, toast]);

  const handleSelectTask = useCallback((task: Task, e: React.MouseEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(task.id)) {
        next.delete(task.id);
      } else {
        next.add(task.id);
      }
      return next;
    });
  }, []);

  const handleLinkView = useCallback((taskId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      onViewTask(task);
    }
  }, [tasks, onViewTask]);

  const handleBatchStatusChange = useCallback(async (status: TaskStatus) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const prevTasks = tasks;
    const newTasks = tasks.map((t) => selectedIds.has(t.id) ? { ...t, status } : t);
    onTasksChange(newTasks);
    setSelectedIds(new Set());

    try {
      await fetch("/api/tasks/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, updates: { status } }),
      });
      const colLabel = COLUMNS.find((c) => c.id === status)?.label || status;
      toast.show(`${ids.length} 个任务已移至「${colLabel}」`, "success");
    } catch (err) {
      onTasksChange(prevTasks);
      toast.show("批量操作失败", "error");
    }
  }, [selectedIds, tasks, onTasksChange, toast]);

  const versionMap = useMemo(() => {
    const map = new Map<number, string>();
    versions.forEach((v) => map.set(v.id, v.name));
    return map;
  }, [versions]);

  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
    setSelectedIds(new Set());
  }, []);

  const handlePriorityFilterChange = useCallback((newFilter: string) => {
    setPriorityFilter(newFilter);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    isModalOpenRef.current = true;
    onEditTask(task);
  }, [onEditTask]);

  const handleViewTask = useCallback((task: Task) => {
    isModalOpenRef.current = true;
    onViewTask(task);
  }, [onViewTask]);

  return (
    <div className={styles.wrap}>
      <FilterBar
        filter={filter}
        onFilterChange={handleFilterChange}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={handlePriorityFilterChange}
        versions={versions}
        activeVersionId={activeVersionId}
        onVersionChange={onVersionChange}
        sortBy={sortBy}
        onSortChange={setSortBy}
        taskCount={tasks.length}
        filteredCount={filtered.length}
        search={search}
        onSearchChange={setSearch}
        showJiafangFilter={showJiafangFilter}
        assignees={assignees}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        dateRangeStart={dateRangeStart}
        dateRangeEnd={dateRangeEnd}
        onDateRangeStartChange={setDateRangeStart}
        onDateRangeEndChange={setDateRangeEnd}
        isRefreshing={isRefreshing}
      />
      <div className={styles.board}>
        {selectedIds.size > 0 && (
          <div className={styles.batchBar}>
            <span className={styles.batchCount}>已选 {selectedIds.size} 项</span>
            <div className={styles.batchActions}>
              {COLUMNS.filter((c) => c.id !== "done").map((c) => (
                <button key={c.id} className={styles.batchBtn} onClick={() => handleBatchStatusChange(c.id)}>
                  移至{c.label}
                </button>
              ))}
            </div>
            <button className={styles.batchClear} onClick={() => setSelectedIds(new Set())}>取消选择</button>
          </div>
        )}
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            col={col}
            tasks={tasksByStatus[col.id]}
            dragId={dragId}
            onQuickAdd={handleQuickAdd}
            onViewTask={handleViewTask}
            onEditTask={handleEditTask}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            dragOverId={dragOverId}
            isDragging={dragId !== null}
            onCommentAdded={handleCommentAdded}
            readonly={readonly}
            getVersionName={(id: number | null) => id != null ? versionMap.get(id) : undefined}
            currentUser={currentUser}
            selectedIds={selectedIds}
            onSelectTask={handleSelectTask}
            onLinkView={handleLinkView}
          />
        ))}
      </div>
    </div>
  );
}
