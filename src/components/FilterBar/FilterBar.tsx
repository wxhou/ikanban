"use client";

import { IconSearch } from "@/components/Icons";
import styles from "./FilterBar.module.css";

const FILTER_TABS = [
  { id: "all" as const, label: "全部" },
  { id: "jiafang" as const, label: "甲方任务" },
  { id: "internal" as const, label: "内部任务" },
  { id: "mine" as const, label: "只看我的" },
];

interface FilterBarProps {
  filter: string;
  onFilterChange: (filter: string) => void;
  taskCount: number;
  filteredCount: number;
  search: string;
  onSearchChange: (search: string) => void;
}

export default function FilterBar({
  filter,
  onFilterChange,
  taskCount,
  filteredCount,
  search,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.pills}>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.pill} ${filter === tab.id ? styles.pillActive : ""}`}
            onClick={() => onFilterChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.spacer} />
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>
          <IconSearch />
        </span>
        <input
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
}
