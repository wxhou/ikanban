"use client";

import { useState, useMemo } from "react";
import type { Version } from "@/lib/types";
import { createVersion, updateVersion, deleteVersion } from "@/api";
import { useToast } from "@/lib/toast-context";
import styles from "./VersionPage.module.css";

interface VersionPageProps {
  versions: Version[];
  onVersionsChange: (versions: Version[]) => void;
}

function parseChangelog(desc: string): string[] {
  return desc
    .split("\n")
    .map((l) => l.trim().replace(/^#+\s*/, "").replace(/^[-*.]\s*/, ""))
    .filter((l) => l && !l.startsWith("---") && !l.match(/^xmpapi?:/) && !l.match(/^xmpweb?:/));
}

function getMajor(ver: string): string {
  const m = ver.match(/V(\d+)\./);
  return m ? `V${m[1]}.x` : "其他";
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / 86400000);
}

function formatAge(age: number): string {
  if (age === 0) return "今天";
  if (age < 30) return `${age}天前`;
  if (age < 365) return `${Math.floor(age / 30)}个月前`;
  return `${Math.floor(age / 365)}年前`;
}

export default function VersionPage({ versions, onVersionsChange }: VersionPageProps) {
  const [search, setSearch] = useState("");
      const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const toast = useToast();

  const filtered = useMemo(() => {
    if (!search.trim()) return versions;
    const q = search.toLowerCase();
    return versions.filter(
      (v) => v.name.toLowerCase().includes(q) || v.description.toLowerCase().includes(q)
    );
  }, [versions, search]);

  const groups = useMemo(() => {
    const map = new Map<string, Version[]>();
    for (const v of filtered) {
      const g = getMajor(v.name);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(v);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const activeVersion = versions.find((v) => v.status === "active");
  const totalVersions = versions.length;

  
  const handleCreate = async () => {
    if (!newName.trim()) { toast.show("请输入版本名称", "error"); return; }
    try {
      const created = await createVersion(newName.trim(), newDesc.trim());
      onVersionsChange([created, ...versions]);
      setNewName(""); setNewDesc(""); setShowCreate(false);
      toast.show("版本已创建", "success");
    } catch (err) { console.error("Failed to create version:", err); toast.show("创建失败", "error"); }
  };

  const handleRename = async (id: number) => {
    if (!editName.trim()) return;
    try {
      const updated = await updateVersion(id, { name: editName.trim(), description: editDesc.trim() });
      onVersionsChange(versions.map((v) => (v.id === id ? updated : v)));
      setEditing(null);
      toast.show("已更新", "success");
    } catch (err) { console.error("Failed to rename version:", err); toast.show("更新失败", "error"); }
  };

  const handleToggle = async (v: Version) => {
    const newStatus = v.status === "active" ? "closed" : "active";
    try {
      const updated = await updateVersion(v.id, { status: newStatus });
      onVersionsChange(versions.map((x) => (x.id === v.id ? updated : x.status === "active" && newStatus === "active" ? { ...x, status: "closed" } : x)));
      toast.show(newStatus === "active" ? "已激活" : "已发布", "success");
    } catch (err) { console.error("Failed to toggle version:", err); toast.show("操作失败", "error"); }
  };

  const handleDelete = async (v: Version) => {
    if (!confirm(`确认删除版本「${v.name}」？`)) return;
    try {
      await deleteVersion(v.id);
      onVersionsChange(versions.filter((x) => x.id !== v.id));
      toast.show("已删除", "success");
    } catch (err) { console.error("Failed to delete version:", err); toast.show("删除失败", "error"); }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>
              <span className={styles.titleDecor} />
              版本历史
            </h1>
            <p className={styles.subtitle}>
              <span className={styles.statBadge}>{totalVersions} 个版本</span>
              {versions.length > 1 && (
                <span className={styles.dateRange}>
                  {versions[versions.length - 1]?.created} — {versions[0]?.created}
                </span>
              )}
            </p>
          </div>
          <button className={styles.addBtn} onClick={() => setShowCreate(!showCreate)}>
            <span className={styles.addIcon}>{showCreate ? "✕" : "+"}</span>
            <span>{showCreate ? "取消" : "新建版本"}</span>
          </button>
        </div>

        {/* Active version highlight */}
        {activeVersion && (
          <div className={styles.heroCard}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              当前版本
            </div>
            <div className={styles.heroContent}>
              <div className={styles.heroLeft}>
                <div className={styles.heroVersion}>{activeVersion.name}</div>
                <div className={styles.heroMeta}>
                  <span className={styles.heroDate}>
                    <span className={styles.calendarIcon}>📅</span>
                    {activeVersion.created}
                  </span>
                  <span className={styles.heroAge}>{formatAge(daysSince(activeVersion.created))}</span>
                </div>
              </div>
              <div className={styles.heroRight}>
                <div className={styles.heroChangelog}>
                  {parseChangelog(activeVersion.description).slice(0, 5).map((line, i) => (
                    <div key={i} className={styles.heroItem}>
                      <span className={styles.heroBullet} />
                      <span className={styles.heroText}>{line}</span>
                    </div>
                  ))}
                  {parseChangelog(activeVersion.description).length > 5 && (
                    <div className={styles.heroMore}>
                      +{parseChangelog(activeVersion.description).length - 5} 项更新
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Create form */}
      {showCreate && (
        <div className={styles.createCard}>
          <div className={styles.createHeader}>
            <span className={styles.createTitle}>创建新版本</span>
          </div>
          <div className={styles.createBody}>
            <input
              className={styles.createInput}
              placeholder="版本号，如 V3.5.0"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              autoFocus
            />
            <textarea
              className={styles.createTextarea}
              placeholder="更新日志，每行一条更新内容..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={5}
            />
          </div>
          <div className={styles.createFooter}>
            <button className={styles.btnPrimary} onClick={handleCreate}>创建版本</button>
            <button className={styles.btnGhost} onClick={() => setShowCreate(false)}>取消</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className={styles.searchWrap}>
        <div className={styles.searchIcon}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <input
          className={styles.searchInput}
          placeholder="搜索版本号或更新内容..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className={styles.searchClear} onClick={() => setSearch("")}>
            ✕
          </button>
        )}
      </div>

      {/* Version list */}
      <div className={styles.versionList}>
        {groups.map(([group, items]) => (
          <section key={group} className={styles.group}>
            <div className={styles.groupHeader}>
              <span className={styles.groupTag}>{group}</span>
              <span className={styles.groupCount}>{items.length} 个版本</span>
            </div>

            <div className={styles.groupList}>
                {items.map((v) => {
                  const lines = parseChangelog(v.description);
                  const isActive = v.status === "active";
                  const age = daysSince(v.created);

                  return (
                    <article key={v.id} className={`${styles.versionItem} ${isActive ? styles.versionItemActive : ""}`}>
                      <div className={styles.versionTimeline}>
                        <div className={`${styles.versionDot} ${isActive ? styles.versionDotActive : ""}`} />
                        {items.indexOf(v) < items.length - 1 && <div className={styles.versionLine} />}
                      </div>

                      <div className={styles.versionBody}>
                        {editing === v.id ? (
                          <div className={styles.editForm}>
                            <input className={styles.editInput} value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="版本号" />
                            <textarea className={styles.editTextarea} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={6} placeholder="更新日志" />
                            <div className={styles.editActions}>
                              <button className={styles.btnPrimary} onClick={() => handleRename(v.id)}>保存</button>
                              <button className={styles.btnGhost} onClick={() => setEditing(null)}>取消</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className={styles.versionHeader}>
                              <div className={styles.versionInfo}>
                                <span className={`${styles.versionName} ${isActive ? styles.versionNameActive : ""}`}>
                                  {v.name}
                                </span>
                                {isActive && <span className={styles.badge}>活跃</span>}
                                <span className={styles.versionDate}>{v.created}</span>
                                <span className={styles.versionAge}>{formatAge(age)}</span>
                              </div>
                              <div className={styles.versionActions}>
                                <button className={styles.actionBtn} onClick={() => { setEditing(v.id); setEditName(v.name); setEditDesc(v.description); }}>编辑</button>
                                <button className={styles.actionBtn} onClick={() => handleToggle(v)}>{isActive ? "结算" : "激活"}</button>
                                {!isActive && <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => handleDelete(v)}>删除</button>}
                              </div>
                            </div>

                            <div className={styles.changelog}>
                              {lines.map((line, i) => (
                                <div key={i} className={styles.changelogItem}>
                                  <span className={styles.changelogBullet} />
                                  <span className={styles.changelogText}>{line}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
          </section>
        ))}

        {filtered.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📦</div>
            <p className={styles.emptyText}>{search ? `没有找到「${search}」相关版本` : "暂无版本记录"}</p>
          </div>
        )}
      </div>
    </div>
  );
}