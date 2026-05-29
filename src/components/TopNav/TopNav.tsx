"use client";

import { IconBoard, IconDash } from "@/components/Icons";
import styles from "./TopNav.module.css";

interface TopNavProps {
  view: "kanban" | "dashboard";
  onViewChange: (view: "kanban" | "dashboard") => void;
}

export default function TopNav({ view, onViewChange }: TopNavProps) {
  return (
    <nav className={styles.topnav}>
      <a className={styles.brand} href="#">
        <div className={styles.logo}>
          <svg viewBox="0 0 28 28" fill="none">
            <rect x="3" y="5" width="9" height="18" rx="2.5" fill="rgba(255,255,255,0.35)" />
            <rect x="16" y="5" width="9" height="13" rx="2.5" fill="rgba(255,255,255,0.6)" />
            <rect x="3" y="5" width="9" height="7" rx="2.5" fill="white" />
            <rect x="16" y="5" width="9" height="4" rx="2" fill="white" />
          </svg>
        </div>
        <span>项目看板</span>
      </a>
      <div className={styles.divider} />
      <span className={styles.project}>智慧运维管理平台 V3</span>
      <div className={styles.spacer} />
      <div className={styles.pill}>
        <button
          className={`${styles.pillBtn} ${view === "kanban" ? styles.pillBtnActive : ""}`}
          onClick={() => onViewChange("kanban")}
        >
          <IconBoard /> 看板
        </button>
        <button
          className={`${styles.pillBtn} ${view === "dashboard" ? styles.pillBtnActive : ""}`}
          onClick={() => onViewChange("dashboard")}
        >
          <IconDash /> 汇报
        </button>
      </div>
      <div className={styles.divider} />
      <div className={styles.avatar}>PM</div>
    </nav>
  );
}
