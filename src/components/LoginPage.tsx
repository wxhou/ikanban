"use client";

import { useState, useEffect } from "react";
import styles from "./LoginPage.module.css";

interface User {
  id: number;
  name: string;
  avatar: string;
  role: string;
}

interface LoginPageProps {
  users: User[];
  onLogin: (user: string) => void;
}

const INITIALS: Record<string, string> = {
  "管理员": "管",
  "惠寅初": "惠",
  "侯伟轩": "侯",
  "杨丽": "杨",
  "简婷": "简",
  "毕浩": "毕",
  "王官豪": "王",
  "袁明亮": "袁",
};

export default function LoginPage({ users, onLogin }: LoginPageProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUserClick = async (user: User) => {
    setSelectedUser(user);
    setPassword("");
    setError("");
    setNeedsSetup(false);
    setChecking(true);
    try {
      const res = await fetch(`/api/auth/password-status?name=${encodeURIComponent(user.name)}`);
      if (res.ok) {
        const data = await res.json();
        setNeedsSetup(!data.hasPassword);
      }
    } catch {
      // assume has password if check fails
    }
    setChecking(false);
  };

  const handleSetPassword = async () => {
    if (!selectedUser) return;
    if (!/^\d{4}$/.test(password)) {
      setError("请输入4位数字密码");
      return;
    }
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedUser.name, password }),
      });
      if (res.ok) {
        onLogin(selectedUser.name);
      } else {
        const data = await res.json();
        setError(data.error || "设置失败");
      }
    } catch {
      setError("网络错误，请重试");
    }
  };

  const handlePasswordSubmit = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedUser.name, password }),
      });
      if (res.ok) {
        onLogin(selectedUser.name);
      } else {
        setError("密码错误");
      }
    } catch {
      setError("验证失败");
    }
  };

  const adminUsers = users.filter((u) => u.role === "admin");
  const regularUsers = users.filter((u) => u.role !== "admin");

  return (
    <div className={`${styles.page} ${mounted ? styles.visible : ""}`}>
      <div className={styles.layout}>
        {/* ── Left: Brand ── */}
        <div className={styles.brand}>
          <div className={styles.brandTop}>
            <div className={styles.logo}>
              <svg className={styles.logoSvg} viewBox="0 0 36 36" fill="none">
                <rect x="4" y="6" width="12" height="24" rx="3" fill="currentColor" opacity="0.3" />
                <rect x="20" y="6" width="12" height="18" rx="3" fill="currentColor" opacity="0.6" />
                <rect x="4" y="6" width="12" height="9" rx="3" fill="currentColor" />
                <rect x="20" y="6" width="12" height="5" rx="2.5" fill="currentColor" />
              </svg>
            </div>

            <div className={styles.brandText}>
              <p className={styles.brandLabel}>智慧运维</p>
              <h1 className={styles.brandTitle}>管理平台</h1>
            </div>
          </div>

          <div className={styles.brandBottom}>
            <p className={styles.brandDesc}>
              项目跟踪 · 版本管理 · 团队协作
            </p>
            <span className={styles.version}>v3.4.4</span>
          </div>
        </div>

        {/* ── Right: Login ── */}
        <div className={styles.main}>
          {selectedUser ? (
            <div className={styles.authCard}>
              <button className={styles.authBack} onClick={() => { setSelectedUser(null); setPassword(""); setError(""); }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                返回
              </button>

              <div className={styles.authHeader}>
                <div className={styles.authAvatar}>
                  {INITIALS[selectedUser.name] || "管"}
                </div>
                <h2 className={styles.authName}>{selectedUser.name}</h2>
                {checking ? (
                  <p className={styles.authHint}>正在检查...</p>
                ) : needsSetup ? (
                  <p className={styles.authHint}>首次登录，请设置4位数字密码</p>
                ) : (
                  <p className={styles.authHint}>输入密码以继续</p>
                )}
              </div>

              {checking ? (
                <div className={styles.authForm}>
                  <div className={styles.spinner} />
                </div>
              ) : needsSetup ? (
                <div className={styles.authForm}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>设置密码</label>
                    <input
                      type="password"
                      className={`${styles.input} ${error ? styles.inputError : ""}`}
                      placeholder="4位数字密码"
                      value={password}
                      maxLength={4}
                      inputMode="numeric"
                      pattern="\d{4}"
                      onChange={(e) => { setPassword(e.target.value.replace(/\D/g, "")); setError(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSetPassword(); }}
                      autoFocus
                    />
                  </div>
                  {error && <p className={styles.fieldError}>{error}</p>}
                  <button className={styles.submitBtn} onClick={handleSetPassword}>设置密码并登录</button>
                </div>
              ) : (
                <div className={styles.authForm}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>密码</label>
                    <input
                      type="password"
                      className={`${styles.input} ${error ? styles.inputError : ""}`}
                      placeholder="请输入密码"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter") handlePasswordSubmit(); }}
                      autoFocus
                    />
                  </div>
                  {error && <p className={styles.fieldError}>{error}</p>}
                  <button className={styles.submitBtn} onClick={handlePasswordSubmit}>确认登录</button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.selectView}>
              <div className={styles.selectHeader}>
                <h2 className={styles.selectTitle}>登录</h2>
                <p className={styles.selectDesc}>选择一个账户以进入工作台</p>
              </div>

              {/* Admin section */}
              <div className={styles.group}>
                <div className={styles.groupLabel}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <polygon points="6,1 7.6,4.5 11.4,5 8.5,7.7 9.2,11.5 6,9.7 2.8,11.5 3.5,7.7 0.6,5 4.4,4.5" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                  </svg>
                  管理员
                </div>
                {adminUsers.map((user, idx) => (
                  <button
                    key={user.id}
                    className={styles.userRow}
                    onClick={() => handleUserClick(user)}
                    style={{"--delay": `${idx * 0.06}s`} as React.CSSProperties}
                  >
                    <span className={styles.userInitial}>{INITIALS[user.name] || "管"}</span>
                    <span className={styles.userName}>{user.name}</span>
                    <span className={styles.userTag}>需要密码</span>
                    <svg className={styles.rowArrow} width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ))}
              </div>

              {/* Member section */}
              <div className={styles.group}>
                <div className={styles.groupLabel}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="4" r="2.5" stroke="currentColor" strokeWidth="1"/>
                    <path d="M1.5 11C1.5 9 3.5 7.5 6 7.5C8.5 7.5 10.5 9 10.5 11" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                  团队成员
                </div>
                {regularUsers.map((user, idx) => (
                  <button
                    key={user.id}
                    className={styles.userRow}
                    onClick={() => handleUserClick(user)}
                    style={{"--delay": `${(adminUsers.length + idx) * 0.06}s`} as React.CSSProperties}
                  >
                    <span className={styles.userInitial} style={{background: "#5b7a6e"}}>
                      {INITIALS[user.name] || "U"}
                    </span>
                    <span className={styles.userName}>{user.name}</span>
                    <span className={styles.userTag}>成员</span>
                    <svg className={styles.rowArrow} width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
