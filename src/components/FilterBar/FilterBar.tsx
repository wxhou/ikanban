"use client";

import { memo } from "react";
import type { Version } from "@/lib/types";
import { IconSearch } from "@/components/Icons";
import styles from "./FilterBar.module.css";

const FILTER_TABS = [
  { id: "all" as const, label: "全部" },
  { id: "jiafang" as const, label: "甲方任务" },
  { id: "internal" as const, label: "内部任务" },
  { id: "mine" as const, label: "只看我的" },
];

const PRIORITY_TABS = [
  { id: "all" as const, label: "全部", color: "" },
  { id: "high" as const, label: "高", color: "var(--danger)" },
  { id: "medium" as const, label: "中", color: "var(--warn)" },
  { id: "low" as const, label: "低", color: "var(--success)" },
];

interface FilterBarProps {
  filter: string;
  onFilterChange: (filter: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (filter: string) => void;
  versions: Version[];
  activeVersionId: number | null;
  onVersionChange: (id: number | null) => void;
  sortBy: string;
  onSortChange: (sort: "default" | "priority" | "due") => void;
  taskCount: number;
  filteredCount: number;
  search: string;
  onSearchChange: (search: string) => void;
  showJiafangFilter?: boolean;
  assignees?: string[];
  assigneeFilter?: string;
  onAssigneeFilterChange?: (assignee: string) => void;
  dateRange?: string;
  onDateRangeChange?: (range: string) => void;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  onDateRangeStartChange?: (date: string) => void;
  onDateRangeEndChange?: (date: string) => void;
  isRefreshing?: boolean;
}

const FilterBar = memo(function FilterBar({
  filter,
  onFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  versions,
  activeVersionId,
  onVersionChange,
  sortBy,
  onSortChange,
  taskCount,
  filteredCount,
  search,
  onSearchChange,
  showJiafangFilter = true,
  assignees,
  assigneeFilter,
  onAssigneeFilterChange,
  dateRange,
  onDateRangeChange,
  dateRangeStart,
  dateRangeEnd,
  onDateRangeStartChange,
  onDateRangeEndChange,
  isRefreshing,
}: FilterBarProps) {
  const visibleTabs = FILTER_TABS.filter((tab) => {
    if (tab.id === "jiafang" && !showJiafangFilter) return false;
    return true;
  });
  return (
    <div className={styles.bar}>
      <div className={styles.pills}>
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.pill} ${filter === tab.id ? styles.pillActive : ""}`}
            onClick={() => onFilterChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.divider} />
      <div className={styles.pills}>
        {PRIORITY_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.pill} ${priorityFilter === tab.id ? styles.pillActive : ""}`}
            onClick={() => onPriorityFilterChange(tab.id)}
          >
            {tab.color && <span className={styles.priorityDot} style={{ background: tab.color }} />}
            {tab.label}
          </button>
        ))}
      </div>
      {assignees && assignees.length > 0 && (
        <>
          <div className={styles.divider} />
          <select
            className={styles.select}
            value={assigneeFilter || ""}
            onChange={(e) => onAssigneeFilterChange?.(e.target.value)}
          >
            <option value="">全部负责人</option>
            {assignees.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </>
      )}
      <div className={styles.divider} />
      <div className={styles.dateRangeGroup}>
        <select
          className={styles.select}
          value={dateRange || ""}
          onChange={(e) => onDateRangeChange?.(e.target.value)}
        >
          <option value="">全部时间</option>
          <option value="today">今天</option>
          <option value="week">本周</option>
          <option value="month">本月</option>
          <option value="custom">自定义</option>
        </select>
        {dateRange === "custom" && (
          <>
            <input type="date" value={dateRangeStart || ""} onChange={(e) => onDateRangeStartChange?.(e.target.value)} className={styles.dateInput} />
            <span>~</span>
            <input type="date" value={dateRangeEnd || ""} onChange={(e) => onDateRangeEndChange?.(e.target.value)} className={styles.dateInput} />
          </>
        )}
      </div>
      {isRefreshing && <span className={styles.refreshIndicator}>⟳</span>}
      <div className={styles.divider} />
      <select
        className={styles.versionSelect}
        value={activeVersionId ?? ""}
        onChange={(e) => onVersionChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">全部版本</option>
        <option value="0">未分配</option>
        {versions.map((v) => (
          <option key={v.id} value={v.id}>{v.name} ({v.status === "active" ? "活跃" : "已发布"})</option>
        ))}
      </select>
      <select
        className={styles.sortSelect}
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as "default" | "priority" | "due")}
      >
        <option value="default">默认排序</option>
        <option value="priority">优先级</option>
        <option value="due">截止日期</option>
      </select>
      <div className={styles.spacer} />
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>
          <IconSearch />
        </span>
        <input
          id="search-input"
          className={styles.searchInput}
          placeholder="搜索任务…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search && (
          <span className={styles.searchClear} onClick={() => onSearchChange("")}>
            <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2l6 6M8 2l-6 6" />
            </svg>
          </span>
        )}
      </div>
      <span className={styles.count}>
        {filteredCount === taskCount ? `${taskCount} 个任务` : `${filteredCount} / ${taskCount} 个任务`}
      </span>
    </div>
  );
});

export default FilterBar;
