"use client";

import { IconBoard, IconDash, IconTable, IconVersions } from "@/components/Icons";
import styles from "./TopNav.module.css";

interface TopNavProps {
  view: "kanban" | "dashboard" | "report" | "versions";
  onViewChange: (view: "kanban" | "dashboard" | "report" | "versions") => void;
  currentUser: string;
  onAvatarClick: () => void;
  onLogout: () => void;
  isAdmin?: boolean;
  onUserManagement?: () => void;
  unreadCount?: number;
  onBellClick?: () => void;
}

export default function TopNav({ view, onViewChange, currentUser, onAvatarClick, onLogout, isAdmin, onUserManagement, unreadCount = 0, onBellClick }: TopNavProps) {
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
        <button className={`${styles.pillBtn} ${view === "kanban" ? styles.pillBtnActive : ""}`} onClick={() => onViewChange("kanban")}>
          <IconBoard /> 看板
        </button>
        <button className={`${styles.pillBtn} ${view === "dashboard" ? styles.pillBtnActive : ""}`} onClick={() => onViewChange("dashboard")}>
          <IconDash /> 总览
        </button>
        <button className={`${styles.pillBtn} ${view === "report" ? styles.pillBtnActive : ""}`} onClick={() => onViewChange("report")}>
          <IconTable /> 汇报
        </button>
        <button className={`${styles.pillBtn} ${view === "versions" ? styles.pillBtnActive : ""}`} onClick={() => onViewChange("versions")}>
          <IconVersions /> 版本
        </button>
      </div>
      <div className={styles.divider} />
      <div className={styles.userInfo}>
        {isAdmin && onUserManagement && (
          <button className={styles.adminBtn} onClick={onUserManagement} title="用户管理">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z" fill="currentColor"/>
            </svg>
            用户管理
          </button>
        )}
        <div className={styles.bellWrap}>
          <button className={styles.bellBtn} onClick={onBellClick} title="通知中心">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6.5 2.5C4.5 3.2 3 5.2 3 7.5V10L2 11V12H14V11L13 10V7.5C13 5.2 11.5 3.2 9.5 2.5V1.5C9.5 0.67 8.83 0 8 0C7.17 0 6.5 0.67 6.5 1.5V2.5Z" fill="currentColor"/>
              <path d="M6 14C6 15.1 6.9 16 8 16C9.1 16 10 15.1 10 14H6Z" fill="currentColor"/>
            </svg>
          </button>
          {unreadCount > 0 && (
            <span className={styles.bellBadge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </div>
        <div className={styles.avatar} onClick={onAvatarClick} title="我的待办">{currentUser.slice(0,1)}</div>
        <button className={styles.logoutBtn} onClick={onLogout} title="退出登录">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 14H3.33C2.6 14 2 13.4 2 12.67V3.33C2 2.6 2.6 2 3.33 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M10.67 11.33L14 8L10.67 4.67" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </nav>
  );
}
