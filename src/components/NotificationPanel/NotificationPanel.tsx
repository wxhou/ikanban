"use client";

import { useEffect, useRef } from "react";
import type { Notification as NotifType } from "@/lib/types";
import styles from "./NotificationPanel.module.css";

const typeLabel: Record<string, string> = {
  assigned: "分配给",
  due_soon: "即将到期",
  overdue: "已逾期",
  commented: "评于",
  completed: "已完成",
};

function timeAgo(created: string): string {
  const now = new Date();
  const then = new Date(created);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

interface NotificationPanelProps {
  notifications: NotifType[];
  onMarkAllRead: () => void;
  onMarkRead: (id: number) => void;
  onClickNotif: (notif: NotifType) => void;
  onClose: () => void;
}

export default function NotificationPanel({
  notifications,
  onMarkAllRead,
  onMarkRead,
  onClickNotif,
  onClose,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className={styles.panel} ref={panelRef}>
      <div className={styles.head}>
        <span className={styles.title}>通知中心</span>
        {unreadCount > 0 && (
          <button className={styles.markAllBtn} onClick={onMarkAllRead}>
            全部已读
          </button>
        )}
      </div>
      <div className={styles.list}>
        {notifications.length === 0 ? (
          <div className={styles.empty}>暂无通知</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`${styles.item} ${!n.read ? styles.unread : ""}`}
              onClick={() => {
                if (!n.read) onMarkRead(n.id);
                if (n.taskId) onClickNotif(n);
              }}
            >
              <div className={styles.itemDot} />
              <div className={styles.itemContent}>
                <div className={styles.itemText}>{n.text}</div>
                <div className={styles.itemMeta}>
                  {typeLabel[n.type] || n.type} · {timeAgo(n.created)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
