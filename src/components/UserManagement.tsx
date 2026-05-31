"use client";

import { useState } from "react";
import styles from "./UserManagement.module.css";

interface User {
  id: number;
  name: string;
  avatar: string;
  role: string;
}

interface UserManagementProps {
  users: User[];
  onClose: () => void;
  onUserChange: () => void;
}

const ROLES = [
  { value: "admin", label: "管理员" },
  { value: "tech_lead", label: "项目经理" },
  { value: "pm", label: "产品经理" },
  { value: "developer", label: "开发工程师" },
  { value: "designer", label: "UI设计师" },
  { value: "tester", label: "测试工程师" },
  { value: "senior_mgmt", label: "高层管理" },
  { value: "client", label: "甲方" },
] as const;

function getRoleLabel(role: string): string {
  return ROLES.find((r) => r.value === role)?.label || role;
}

export default function UserManagement({ users, onClose, onUserChange }: UserManagementProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("developer");
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!newName.trim()) {
      setError("请输入用户名");
      return;
    }
    if (users.some((u) => u.name === newName.trim())) {
      setError("用户名已存在");
      return;
    }
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), role: newRole }),
      });
      if (res.ok) {
        setNewName("");
        setNewRole("developer");
        setShowAdd(false);
        setError("");
        onUserChange();
      } else {
        setError("创建失败");
      }
    } catch (err) {
      console.error("Failed to create user:", err);
      setError("创建失败");
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`确认删除用户「${user.name}」？`)) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (res.ok) {
        onUserChange();
      }
    } catch (err) { console.error("Failed to delete user:", err); }
  };

  const handleRoleChange = async (user: User, newRole: string) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        onUserChange();
      }
    } catch (err) { console.error("Failed to change role:", err); }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>用户管理</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.toolbar}>
            <button className={styles.addBtn} onClick={() => setShowAdd(!showAdd)}>
              <span className={styles.addIcon}>{showAdd ? "✕" : "+"}</span>
              <span>{showAdd ? "取消" : "添加用户"}</span>
            </button>
          </div>

          {showAdd && (
            <div className={styles.addForm}>
              <input
                className={styles.input}
                placeholder="用户名"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setError(""); }}
                autoFocus
              />
              <select
                className={styles.select}
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <button className={styles.submitBtn} onClick={handleAdd}>添加</button>
              {error && <span className={styles.error}>{error}</span>}
            </div>
          )}

          <div className={styles.userList}>
            {users.map((user) => (
              <div key={user.id} className={styles.userItem}>
                <div className={styles.userInfo}>
                  <div className={styles.avatar}>
                    {user.role === "admin" ? "👑" : "👤"}
                  </div>
                  <div className={styles.userDetail}>
                    <span className={styles.userName}>{user.name}</span>
                    <span className={styles.userRole}>{getRoleLabel(user.role)}</span>
                  </div>
                </div>
                <div className={styles.userActions}>
                  <select
                    className={styles.roleSelect}
                    value={user.role}
                    onChange={(e) => handleRoleChange(user, e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  {user.role !== "admin" && (
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(user)}
                      title="删除用户"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 4H14M5 4V3C5 2.45 5.45 2 6 2H10C10.55 2 11 2.45 11 3V4M6 7V12M10 7V12M3 4L4 14H12L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
