import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import type { Task, Subtask, Comment, Version, TaskLink, LinkType } from "./types";

const BCRYPT_ROUNDS = 10;

const url = process.env.LIBSQL_URL || "file:data/kanban.db";
const authToken = process.env.LIBSQL_AUTH_TOKEN;

let _client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!_client) {
    _client = createClient({ url, authToken });
  }
  return _client;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function ensureSchema() {
  const db = getClient();
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS versions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'active',
      description TEXT NOT NULL DEFAULT '',
      created     TEXT NOT NULL DEFAULT (date('now'))
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT NOT NULL,
      desc       TEXT DEFAULT '',
      status     TEXT NOT NULL DEFAULT 'todo',
      priority   TEXT NOT NULL DEFAULT 'medium',
      source     TEXT NOT NULL DEFAULT 'internal',
      requester  TEXT,
      assignees  TEXT NOT NULL DEFAULT '[]',
      tags       TEXT NOT NULL DEFAULT '[]',
      version_id INTEGER REFERENCES versions(id),
      due        TEXT,
      created    TEXT NOT NULL DEFAULT (date('now')),
      updated    TEXT NOT NULL DEFAULT (date('now'))
    );
    CREATE TABLE IF NOT EXISTS subtasks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      text       TEXT NOT NULL DEFAULT '',
      done       INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
    CREATE TABLE IF NOT EXISTS comments (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user       TEXT NOT NULL,
      text       TEXT NOT NULL,
      images     TEXT NOT NULL DEFAULT '[]',
      created    TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
    CREATE TABLE IF NOT EXISTS task_links (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id         INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      linked_task_id  INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      link_type       TEXT NOT NULL DEFAULT 'related',
      created         TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(task_id, linked_task_id)
    );
    CREATE INDEX IF NOT EXISTS idx_task_links_task_id ON task_links(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_links_linked ON task_links(linked_task_id);
    CREATE TABLE IF NOT EXISTS notifications (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_name  TEXT NOT NULL,
      type       TEXT NOT NULL,
      task_id    INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
      text       TEXT NOT NULL,
      read       INTEGER NOT NULL DEFAULT 0,
      created    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_name, read, created);
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      avatar     TEXT DEFAULT '',
      role       TEXT NOT NULL DEFAULT 'developer',
      password   TEXT DEFAULT '',
      created    TEXT NOT NULL DEFAULT (date('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash  TEXT NOT NULL UNIQUE,
      created     TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      expires_at  TEXT NOT NULL,
      last_used   TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, expires_at);
  `);
  // Migration: add images column to comments if missing
  try {
    await db.execute("ALTER TABLE comments ADD COLUMN images TEXT NOT NULL DEFAULT '[]'");
  } catch (_) {
    // column already exists
  }
  await seedIfEmpty();
}

async function seedIfEmpty() {
  const db = getClient();
  const r = await db.execute("SELECT COUNT(*) as cnt FROM tasks");
  if ((r.rows[0].cnt as number) > 0) return;
  const rv = await db.execute("SELECT COUNT(*) as cnt FROM versions");
  if ((rv.rows[0].cnt as number) === 0) {
    await db.execute("INSERT INTO versions (name, status, description, created) VALUES (?, ?, ?, ?)", ["V3.0", "closed", "5月份稳定版本，包含首页UI、登录模块、周报模板等基础功能", "2026-05-01"]);
    await db.execute("INSERT INTO versions (name, status, description, created) VALUES (?, ?, ?, ?)", ["V3.1", "active", "6月份迭代，SSO对接、性能优化、支付集成、审批流程", "2026-06-01"]);
  }

  // Seed users
  const ru = await db.execute("SELECT COUNT(*) as cnt FROM users");
  if ((ru.rows[0].cnt as number) === 0) {
    // Add admin user with hashed password
    const adminHash = await hashPassword("admin123");
    await db.execute("INSERT INTO users (name, role, password) VALUES (?, ?, ?)", ["管理员", "admin", adminHash]);
    // Add regular users with name as default password (hashed)
    const defaultUsers = ["惠寅初", "侯伟轩", "杨丽", "简婷", "毕浩", "王官豪", "袁明亮"];
    for (const name of defaultUsers) {
      const hashed = await hashPassword(name);
      await db.execute("INSERT INTO users (name, role, password) VALUES (?, ?, ?)", [name, "developer", hashed]);
    }
  }
  const vers = await db.execute("SELECT id, status FROM versions");
  const activeId = (vers.rows.find((r) => r.status === "active")! as unknown as { id: number }).id;
  const closedId = (vers.rows.find((r) => r.status === "closed")! as unknown as { id: number }).id;

  const seeds: { title: string; desc: string; status: string; priority: string; source: string; requester: string | null; assignees: string; tags: string; versionId: number | null; due: string; created: string }[] = [
    { title: "完成首页 UI 设计稿", desc: "参照 Figma 设计规范，完成甲方要求的首页 UI 初稿", status: "done", priority: "high", source: "jiafang", requester: "需求对接人", assignees: '["惠寅初"]', tags: '["UI","设计"]', versionId: closedId, due: "2026-05-10", created: "2026-05-01" },
    { title: "登录模块接口对接", desc: "与甲方 SSO 系统对接，完成 OAuth 认证流程", status: "inprogress", priority: "high", source: "jiafang", requester: "项目对接人", assignees: '["侯伟轩","杨丽"]', tags: '["SSO","认证"]', versionId: activeId, due: "2026-05-18", created: "2026-05-05" },
    { title: "数据库结构设计", desc: "根据需求文档设计项目数据库 ER 图", status: "review", priority: "medium", source: "internal", requester: null, assignees: '["简婷"]', tags: "[]", versionId: activeId, due: "2026-05-20", created: "2026-05-03" },
    { title: "导出功能 BUG 修复", desc: "Excel 导出时数字精度丢失问题", status: "blocked", priority: "high", source: "internal", requester: null, assignees: '["杨丽"]', tags: '["BUG","紧急"]', versionId: activeId, due: "2026-05-15", created: "2026-05-08" },
    { title: "集成测试报告撰写", desc: "汇总各模块测试结果，形成整体报告", status: "todo", priority: "medium", source: "jiafang", requester: "需求对接人", assignees: '["惠寅初"]', tags: "[]", versionId: activeId, due: "2026-05-28", created: "2026-05-10" },
    { title: "部署文档编写", desc: "整理部署步骤与常见问题处理方案", status: "todo", priority: "low", source: "internal", requester: null, assignees: '["毕浩"]', tags: "[]", versionId: activeId, due: "2026-06-01", created: "2026-05-11" },
    { title: "性能优化压测", desc: "压测 500 并发下的接口响应时间", status: "inprogress", priority: "medium", source: "internal", requester: null, assignees: '["侯伟轩"]', tags: '["性能"]', versionId: activeId, due: "2026-05-22", created: "2026-05-09" },
    { title: "第三方支付对接", desc: "支付宝/微信支付接口集成", status: "todo", priority: "high", source: "jiafang", requester: "项目对接人", assignees: '["袁明亮"]', tags: '["支付"]', versionId: activeId, due: "2026-05-25", created: "2026-05-12" },
    { title: "上线审批流程确认", desc: "与甲方确认正式环境上线审批流程", status: "review", priority: "high", source: "jiafang", requester: "项目对接人", assignees: '["惠寅初","简婷"]', tags: "[]", versionId: activeId, due: "2026-05-17", created: "2026-05-06" },
    { title: "项目周报模板", desc: "制作标准化周报模板供甲方每周汇报使用", status: "done", priority: "low", source: "jiafang", requester: "需求对接人", assignees: '["毕浩"]', tags: "[]", versionId: closedId, due: "2026-05-08", created: "2026-05-01" },
  ];

  for (const s of seeds) {
    // 跳过已存在的种子数据（按标题检查）
    const existing = await db.execute({
      sql: "SELECT id FROM tasks WHERE title = ?",
      args: [s.title],
    });
    if (existing.rows.length > 0) continue;

    const r = await db.execute({
      sql: "INSERT INTO tasks (title, desc, status, priority, source, requester, assignees, tags, version_id, due, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [s.title, s.desc, s.status, s.priority, s.source, s.requester, s.assignees, s.tags, s.versionId, s.due, s.created],
    });
    const taskId = Number(r.lastInsertRowid);
    if (s.title === "完成首页 UI 设计稿") {
      await db.execute({ sql: "INSERT INTO subtasks (task_id, text, done, sort_order) VALUES (?, ?, 1, 0)", args: [taskId, "竞品分析"] });
      await db.execute({ sql: "INSERT INTO subtasks (task_id, text, done, sort_order) VALUES (?, ?, 1, 1)", args: [taskId, "线框图绘制"] });
      await db.execute({ sql: "INSERT INTO subtasks (task_id, text, done, sort_order) VALUES (?, ?, 1, 2)", args: [taskId, "高保真设计稿"] });
      await db.execute({ sql: "INSERT INTO comments (task_id, user, text, created) VALUES (?, ?, ?, ?)", args: [taskId, "惠寅初", "设计稿已完成，已发给甲方审阅", "2026-05-09 14:20"] });
      await db.execute({ sql: "INSERT INTO comments (task_id, user, text, created) VALUES (?, ?, ?, ?)", args: [taskId, "毕浩", "甲方反馈首页配色需要调整", "2026-05-10 09:15"] });
    }
    if (s.title === "登录模块接口对接") {
      await db.execute({ sql: "INSERT INTO subtasks (task_id, text, done, sort_order) VALUES (?, ?, 1, 0)", args: [taskId, "OAuth 文档阅读"] });
      await db.execute({ sql: "INSERT INTO subtasks (task_id, text, done, sort_order) VALUES (?, ?, 0, 1)", args: [taskId, "接口联调"] });
      await db.execute({ sql: "INSERT INTO subtasks (task_id, text, done, sort_order) VALUES (?, ?, 0, 2)", args: [taskId, "异常处理"] });
      await db.execute({ sql: "INSERT INTO comments (task_id, user, text, created) VALUES (?, ?, ?, ?)", args: [taskId, "侯伟轩", "已拿到甲方 SSO 文档，开始对接", "2026-05-16 11:00"] });
    }
    if (s.title === "导出功能 BUG 修复") {
      await db.execute({ sql: "INSERT INTO subtasks (task_id, text, done, sort_order) VALUES (?, ?, 1, 0)", args: [taskId, "定位 bug 原因"] });
      await db.execute({ sql: "INSERT INTO subtasks (task_id, text, done, sort_order) VALUES (?, ?, 0, 1)", args: [taskId, "修复精度问题"] });
      await db.execute({ sql: "INSERT INTO subtasks (task_id, text, done, sort_order) VALUES (?, ?, 0, 2)", args: [taskId, "回归测试"] });
      await db.execute({ sql: "INSERT INTO comments (task_id, user, text, created) VALUES (?, ?, ?, ?)", args: [taskId, "杨丽", "已定位到是浮点数精度问题，需要改用 Decimal 类型", "2026-05-14 16:30"] });
    }
  }
}

async function getSubtaskRows(taskId: number) {
  const db = getClient();
  const r = await db.execute({ sql: "SELECT * FROM subtasks WHERE task_id = ? ORDER BY sort_order", args: [taskId] });
  return r.rows;
}

async function getCommentRows(taskId: number) {
  const db = getClient();
  const r = await db.execute({ sql: "SELECT * FROM comments WHERE task_id = ? ORDER BY id", args: [taskId] });
  return r.rows;
}

function recordToTask(row: Record<string, unknown>, subtasks: Subtask[] = [], comments: Comment[] = [], linkedTasks: TaskLink[] = []): Task {
  return {
    id: row.id as number,
    title: row.title as string,
    desc: row.desc as string,
    status: row.status as Task["status"],
    priority: row.priority as Task["priority"],
    source: row.source as Task["source"],
    requester: row.requester as string | null,
    assignees: JSON.parse(row.assignees as string),
    tags: JSON.parse(row.tags as string),
    versionId: row.version_id as number | null,
    due: row.due as string | null,
    created: row.created as string,
    updated: row.updated as string,
    subtasks,
    comments,
    linkedTasks,
  };
}

// ── Public API ──

let _initialized = false;

async function init() {
  if (!_initialized) {
    await ensureSchema();
    _initialized = true;
  }
}

export interface PaginatedResult {
  data: Task[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getAllTasks(opts?: { 
  page?: number; 
  pageSize?: number; 
  source?: string;
  assignee?: string;
  createdAfter?: string;
  createdBefore?: string;
}): Promise<Task[] | PaginatedResult> {
  await init();
  const db = getClient();

  const conditions: string[] = [];
  const whereArgs: string[] = [];
  let useDistinct = false;
  let joinClause = "";

  if (opts?.source) {
    conditions.push("tasks.source = ?");
    whereArgs.push(opts.source);
  }
  if (opts?.assignee) {
    joinClause = "JOIN json_each(tasks.assignees)";
    conditions.push("json_each.value = ?");
    whereArgs.push(opts.assignee);
    useDistinct = true;
  }
  if (opts?.createdAfter) {
    conditions.push("tasks.created >= ?");
    whereArgs.push(opts.createdAfter);
  }
  if (opts?.createdBefore) {
    conditions.push("tasks.created <= ?");
    whereArgs.push(opts.createdBefore);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const selectCols = useDistinct ? "DISTINCT tasks.*" : "*";
  const fromClause = `FROM tasks ${joinClause}`;

  if (opts?.page && opts?.pageSize) {
    const { page, pageSize } = opts;
    const countSql = useDistinct
      ? `SELECT COUNT(DISTINCT tasks.id) as cnt ${fromClause} ${where}`
      : `SELECT COUNT(*) as cnt ${fromClause} ${where}`;
    const countRes = await db.execute({ sql: countSql, args: whereArgs });
    const total = countRes.rows[0].cnt as number;
    const offset = (page - 1) * pageSize;
    const r = await db.execute({ sql: `SELECT ${selectCols} ${fromClause} ${where} ORDER BY tasks.id LIMIT ? OFFSET ?`, args: [...whereArgs, pageSize, offset] });
    const tasks = r.rows.length === 0 ? [] : await hydrateTasks(db, r.rows);
    return { data: tasks, total, page, pageSize };
  }

  const r = await db.execute({ sql: `SELECT ${selectCols} ${fromClause} ${where} ORDER BY tasks.id`, args: whereArgs });
  if (r.rows.length === 0) return [];
  return hydrateTasks(db, r.rows);
}

export async function getUniqueAssignees(): Promise<string[]> {
  const db = getClient();
  const result = await db.execute("SELECT assignees FROM tasks");
  const all = new Set<string>();
  for (const row of result.rows) {
    try {
      const arr = JSON.parse(row.assignees as string);
      if (Array.isArray(arr)) arr.forEach((a: string) => all.add(a));
    } catch {}
  }
  return [...all].sort();
}

async function hydrateTasks(db: ReturnType<typeof getClient>, taskRows: Record<string, unknown>[]): Promise<Task[]> {
  const ids = taskRows.map((row) => row.id as number);
  const placeholders = ids.map(() => "?").join(",");
  const [subsRes, commsRes, linksRes] = await Promise.all([
    db.execute({ sql: `SELECT * FROM subtasks WHERE task_id IN (${placeholders}) ORDER BY task_id, sort_order`, args: ids }),
    db.execute({ sql: `SELECT * FROM comments WHERE task_id IN (${placeholders}) ORDER BY task_id, id`, args: ids }),
    db.execute({ sql: `SELECT tl.*, t.title as linked_task_title FROM task_links tl JOIN tasks t ON t.id = tl.linked_task_id WHERE tl.task_id IN (${placeholders}) ORDER BY tl.task_id`, args: ids }),
  ]);

  const subsByTask = new Map<number, Subtask[]>();
  for (const rr of subsRes.rows) {
    const tid = rr.task_id as number;
    if (!subsByTask.has(tid)) subsByTask.set(tid, []);
    subsByTask.get(tid)!.push({ id: rr.id as number, taskId: tid, text: rr.text as string, done: (rr.done as number) === 1, sortOrder: rr.sort_order as number });
  }

  const commsByTask = new Map<number, Comment[]>();
  for (const rr of commsRes.rows) {
    const tid = rr.task_id as number;
    if (!commsByTask.has(tid)) commsByTask.set(tid, []);
    commsByTask.get(tid)!.push({ id: rr.id as number, taskId: tid, user: rr.user as string, text: rr.text as string, images: rr.images as string, created: rr.created as string });
  }

  const linksByTask = new Map<number, TaskLink[]>();
  for (const rr of linksRes.rows) {
    const tid = rr.task_id as number;
    if (!linksByTask.has(tid)) linksByTask.set(tid, []);
    linksByTask.get(tid)!.push({
      id: rr.id as number,
      taskId: tid,
      linkedTaskId: rr.linked_task_id as number,
      linkType: rr.link_type as LinkType,
      linkedTaskTitle: rr.linked_task_title as string,
    });
  }

  return taskRows.map((row) => recordToTask(
    row,
    subsByTask.get(row.id as number) || [],
    commsByTask.get(row.id as number) || [],
    linksByTask.get(row.id as number) || [],
  ));
}

export async function createTask(task: Omit<Task, "id" | "created" | "updated" | "subtasks" | "comments">): Promise<Task> {
  await init();
  const db = getClient();
  const r = await db.execute({
    sql: "INSERT INTO tasks (title, desc, status, priority, source, requester, assignees, tags, version_id, due) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
    args: [task.title, task.desc, task.status, task.priority, task.source, task.requester, JSON.stringify(task.assignees), JSON.stringify(task.tags || []), task.versionId ?? null, task.due],
  });
  return recordToTask(r.rows[0] as Record<string, unknown>);
}

export async function updateTask(id: number, fields: Partial<Omit<Task, "id" | "created" | "updated" | "subtasks" | "comments">>): Promise<Task | null> {
  await init();
  const db = getClient();

  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (["id", "created", "updated", "subtasks", "comments"].includes(key)) continue;
    sets.push(`${key} = ?`);
    args.push(["assignees", "tags"].includes(key) ? JSON.stringify(value) : value as string | number | null);
  }
  if (sets.length === 0) {
    // No fields to update, just fetch existing
    const existing = (await db.execute({ sql: "SELECT * FROM tasks WHERE id = ?", args: [id] })).rows[0];
    if (!existing) return null;
    const [subs, comms] = await Promise.all([getSubtaskRows(id), getCommentRows(id)]);
    return recordToTask(existing as Record<string, unknown>, subs.map((rr) => ({ id: rr.id as number, taskId: rr.task_id as number, text: rr.text as string, done: (rr.done as number) === 1, sortOrder: rr.sort_order as number })), comms.map((rr) => ({ id: rr.id as number, taskId: rr.task_id as number, user: rr.user as string, text: rr.text as string, images: rr.images as string, created: rr.created as string })));
  }
  args.push(id);
  const r = await db.execute({ sql: `UPDATE tasks SET ${sets.join(", ")}, updated = date('now') WHERE id = ? RETURNING *`, args });
  if (r.rows.length === 0) return null;
  const [subs, comms] = await Promise.all([getSubtaskRows(id), getCommentRows(id)]);
  return recordToTask(r.rows[0] as Record<string, unknown>, subs.map((rr) => ({ id: rr.id as number, taskId: rr.task_id as number, text: rr.text as string, done: (rr.done as number) === 1, sortOrder: rr.sort_order as number })), comms.map((rr) => ({ id: rr.id as number, taskId: rr.task_id as number, user: rr.user as string, text: rr.text as string, images: rr.images as string, created: rr.created as string })));
}

export async function batchUpdateTasks(ids: number[], updates: { status?: string; priority?: string; assignees?: string[] }): Promise<number> {
  if (ids.length === 0) return 0;
  await init();
  const db = getClient();

  const sets: string[] = ["updated = date('now')"];
  const args: (string | number)[] = [];

  if (updates.status !== undefined) { sets.push("status = ?"); args.push(updates.status); }
  if (updates.priority !== undefined) { sets.push("priority = ?"); args.push(updates.priority); }
  if (updates.assignees !== undefined) { sets.push("assignees = ?"); args.push(JSON.stringify(updates.assignees)); }

  const placeholders = ids.map(() => "?").join(",");
  args.push(...ids);
  const r = await db.execute({ sql: `UPDATE tasks SET ${sets.join(", ")} WHERE id IN (${placeholders})`, args });
  return r.rowsAffected;
}

export async function deleteTask(id: number): Promise<boolean> {
  await init();
  const db = getClient();
  const r = await db.execute({ sql: "DELETE FROM tasks WHERE id = ?", args: [id] });
  return r.rowsAffected > 0;
}

// ── Subtask CRUD ──

export async function createSubtask(taskId: number, text: string): Promise<Subtask | null> {
  await init();
  const db = getClient();
  const task = (await db.execute({ sql: "SELECT id FROM tasks WHERE id = ?", args: [taskId] })).rows[0];
  if (!task) return null;
  const mx = await db.execute({ sql: "SELECT COALESCE(MAX(sort_order), -1) as m FROM subtasks WHERE task_id = ?", args: [taskId] });
  const r = await db.execute({ sql: "INSERT INTO subtasks (task_id, text, done, sort_order) VALUES (?, ?, 0, ?) RETURNING *", args: [taskId, text, (mx.rows[0].m as number) + 1] });
  const row = r.rows[0];
  return { id: row.id as number, taskId: row.task_id as number, text: row.text as string, done: false, sortOrder: row.sort_order as number };
}

export async function updateSubtask(taskId: number, subtaskId: number, fields: { text?: string; done?: boolean }): Promise<Subtask | null> {
  await init();
  const db = getClient();
  const sets: string[] = [];
  const args: (string | number)[] = [];
  if (fields.text !== undefined) { sets.push("text = ?"); args.push(fields.text); }
  if (fields.done !== undefined) { sets.push("done = ?"); args.push(fields.done ? 1 : 0); }
  if (sets.length === 0) {
    const existing = (await db.execute({ sql: "SELECT * FROM subtasks WHERE id = ? AND task_id = ?", args: [subtaskId, taskId] })).rows[0];
    if (!existing) return null;
    return { id: existing.id as number, taskId: existing.task_id as number, text: existing.text as string, done: (existing.done as number) === 1, sortOrder: existing.sort_order as number };
  }
  args.push(subtaskId, taskId);
  const r = await db.execute({ sql: `UPDATE subtasks SET ${sets.join(", ")} WHERE id = ? AND task_id = ? RETURNING *`, args });
  if (r.rows.length === 0) return null;
  await db.execute({ sql: "UPDATE tasks SET updated = date('now') WHERE id = ?", args: [taskId] });
  const row = r.rows[0];
  return { id: row.id as number, taskId: row.task_id as number, text: row.text as string, done: (row.done as number) === 1, sortOrder: row.sort_order as number };
}

export async function deleteSubtask(taskId: number, subtaskId: number): Promise<boolean> {
  await init();
  const db = getClient();
  const r = await db.execute({ sql: "DELETE FROM subtasks WHERE id = ? AND task_id = ?", args: [subtaskId, taskId] });
  if (r.rowsAffected > 0) {
    await db.execute({ sql: "UPDATE tasks SET updated = date('now') WHERE id = ?", args: [taskId] });
    return true;
  }
  return false;
}

// ── Comment CRUD ──

export async function createComment(taskId: number, user: string, text: string, images: string[] = []): Promise<Comment | null> {
  await init();
  const db = getClient();
  const task = (await db.execute({ sql: "SELECT id FROM tasks WHERE id = ?", args: [taskId] })).rows[0];
  if (!task) return null;
  const r = await db.execute({ sql: "INSERT INTO comments (task_id, user, text, images) VALUES (?, ?, ?, ?) RETURNING *", args: [taskId, user, text, JSON.stringify(images)] });
  await db.execute({ sql: "UPDATE tasks SET updated = date('now') WHERE id = ?", args: [taskId] });
  const row = r.rows[0];
  return { id: row.id as number, taskId: row.task_id as number, user: row.user as string, text: row.text as string, images: row.images as string, created: row.created as string };
}

export async function deleteComment(taskId: number, commentId: number): Promise<boolean> {
  await init();
  const db = getClient();
  const r = await db.execute({ sql: "DELETE FROM comments WHERE id = ? AND task_id = ?", args: [commentId, taskId] });
  if (r.rowsAffected > 0) {
    await db.execute({ sql: "UPDATE tasks SET updated = date('now') WHERE id = ?", args: [taskId] });
    return true;
  }
  return false;
}

// ── User CRUD ──

export async function getAllUsers(): Promise<{ id: number; name: string; avatar: string; role: string }[]> {
  await init();
  const db = getClient();
  const r = await db.execute("SELECT * FROM users ORDER BY id");
  return r.rows.map((row) => ({
    id: row.id as number,
    name: row.name as string,
    avatar: row.avatar as string,
    role: row.role as string,
  }));
}

export async function getUserByName(name: string): Promise<{ id: number; name: string; avatar: string; role: string; password: string } | null> {
  await init();
  const db = getClient();
  const r = await db.execute({ sql: "SELECT * FROM users WHERE name = ?", args: [name] });
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  return {
    id: row.id as number,
    name: row.name as string,
    avatar: row.avatar as string,
    role: row.role as string,
    password: row.password as string,
  };
}

export async function verifyUserPassword(name: string, password: string): Promise<boolean> {
  const user = await getUserByName(name);
  if (!user) return false;

  // Try bcrypt comparison first (hashed passwords start with "$2")
  if (user.password.startsWith("$2")) {
    return comparePassword(password, user.password);
  }

  // Fallback: plaintext comparison
  if (user.password === password) {
    // Auto-upgrade: hash and persist
    const hashed = await hashPassword(password);
    const db = getClient();
    await db.execute({ sql: "UPDATE users SET password = ? WHERE name = ?", args: [hashed, name] });
    return true;
  }

  return false;
}

export async function checkUserHasPassword(name: string): Promise<boolean> {
  const user = await getUserByName(name);
  if (!user) return false;
  return user.password !== "";
}

export async function setUserInitialPassword(name: string, password: string): Promise<boolean> {
  const user = await getUserByName(name);
  if (!user || user.password !== "") return false;
  await init();
  const db = getClient();
  const hashed = await hashPassword(password);
  await db.execute({ sql: "UPDATE users SET password = ? WHERE name = ?", args: [hashed, name] });
  return true;
}

export async function createUser(name: string, role: string = "developer", avatar: string = "", password: string = ""): Promise<{ id: number; name: string; avatar: string; role: string }> {
  await init();
  const db = getClient();
  const hashed = password ? await hashPassword(password) : "";
  const r = await db.execute({ sql: "INSERT INTO users (name, role, avatar, password) VALUES (?, ?, ?, ?) RETURNING *", args: [name, role, avatar, hashed] });
  const row = r.rows[0];
  return {
    id: row.id as number,
    name: row.name as string,
    avatar: row.avatar as string,
    role: row.role as string,
  };
}

export async function updateUser(id: number, fields: { name?: string; role?: string; avatar?: string; password?: string }): Promise<{ id: number; name: string; avatar: string; role: string } | null> {
  await init();
  const db = getClient();

  const sets: string[] = [];
  const args: (string | number)[] = [];
  if (fields.name !== undefined) { sets.push("name = ?"); args.push(fields.name); }
  if (fields.role !== undefined) { sets.push("role = ?"); args.push(fields.role); }
  if (fields.avatar !== undefined) { sets.push("avatar = ?"); args.push(fields.avatar); }
  if (fields.password !== undefined) {
    sets.push("password = ?");
    args.push(fields.password ? await hashPassword(fields.password) : "");
  }
  if (sets.length === 0) {
    const existing = (await db.execute({ sql: "SELECT * FROM users WHERE id = ?", args: [id] })).rows[0];
    if (!existing) return null;
    return { id: existing.id as number, name: existing.name as string, avatar: existing.avatar as string, role: existing.role as string };
  }
  args.push(id);
  const r = await db.execute({ sql: `UPDATE users SET ${sets.join(", ")} WHERE id = ? RETURNING *`, args });
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  return { id: row.id as number, name: row.name as string, avatar: row.avatar as string, role: row.role as string };
}

export async function deleteUser(id: number): Promise<boolean> {
  await init();
  const db = getClient();
  const r = await db.execute({ sql: "DELETE FROM users WHERE id = ?", args: [id] });
  return r.rowsAffected > 0;
}

// ── Version CRUD ──

export async function getVersions(): Promise<Version[]> {
  await init();
  const db = getClient();
  const r = await db.execute("SELECT * FROM versions ORDER BY id DESC");
  return r.rows.map((row) => ({
    id: row.id as number,
    name: row.name as string,
    status: row.status as Version["status"],
    description: row.description as string,
    created: row.created as string,
  }));
}

export async function createVersion(name: string, description: string = ""): Promise<Version> {
  await init();
  const db = getClient();
  await db.execute({ sql: "UPDATE versions SET status = 'closed' WHERE status = 'active'" });
  const r = await db.execute({ sql: "INSERT INTO versions (name, status, description) VALUES (?, 'active', ?) RETURNING *", args: [name, description] });
  const row = r.rows[0];
  return { id: row.id as number, name: row.name as string, status: row.status as Version["status"], description: row.description as string, created: row.created as string };
}

export async function updateVersion(id: number, fields: { name?: string; status?: "active" | "closed"; description?: string }): Promise<Version | null> {
  await init();
  const db = getClient();
  if (fields.status === "active") {
    await db.execute("UPDATE versions SET status = 'closed' WHERE status = 'active'");
  }
  const sets: string[] = [];
  const args: (string | number)[] = [];
  if (fields.name !== undefined) { sets.push("name = ?"); args.push(fields.name); }
  if (fields.status !== undefined) { sets.push("status = ?"); args.push(fields.status); }
  if (fields.description !== undefined) { sets.push("description = ?"); args.push(fields.description); }
  if (sets.length === 0) {
    const existing = (await db.execute({ sql: "SELECT * FROM versions WHERE id = ?", args: [id] })).rows[0];
    if (!existing) return null;
    return { id: existing.id as number, name: existing.name as string, status: existing.status as Version["status"], description: existing.description as string, created: existing.created as string };
  }
  args.push(id);
  const r = await db.execute({ sql: `UPDATE versions SET ${sets.join(", ")} WHERE id = ? RETURNING *`, args });
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  return { id: row.id as number, name: row.name as string, status: row.status as Version["status"], description: row.description as string, created: row.created as string };
}

export async function deleteVersion(id: number): Promise<boolean> {
  await init();
  const db = getClient();
  const cnt = await db.execute({ sql: "SELECT COUNT(*) as c FROM tasks WHERE version_id = ?", args: [id] });
  if ((cnt.rows[0].c as number) > 0) return false;
  const r = await db.execute({ sql: "DELETE FROM versions WHERE id = ?", args: [id] });
  return r.rowsAffected > 0;
}

// ── Task Links CRUD ──

export async function getTaskLinks(taskId: number): Promise<TaskLink[]> {
  await init();
  const db = getClient();
  const r = await db.execute({
    sql: "SELECT tl.*, t.title as linked_task_title FROM task_links tl JOIN tasks t ON t.id = tl.linked_task_id WHERE tl.task_id = ? ORDER BY tl.id",
    args: [taskId],
  });
  return r.rows.map((rr) => ({
    id: rr.id as number,
    taskId: rr.task_id as number,
    linkedTaskId: rr.linked_task_id as number,
    linkType: rr.link_type as LinkType,
    linkedTaskTitle: rr.linked_task_title as string,
  }));
}

export async function createTaskLink(taskId: number, linkedTaskId: number, linkType: LinkType): Promise<TaskLink> {
  await init();
  const db = getClient();
  const r = await db.execute({
    sql: "INSERT OR IGNORE INTO task_links (task_id, linked_task_id, link_type) VALUES (?, ?, ?) RETURNING *",
    args: [taskId, linkedTaskId, linkType],
  });
  if (r.rows.length === 0) {
    // Already exists, fetch the existing one
    const existing = (await db.execute({
      sql: "SELECT tl.*, t.title as linked_task_title FROM task_links tl JOIN tasks t ON t.id = tl.linked_task_id WHERE tl.task_id = ? AND tl.linked_task_id = ?",
      args: [taskId, linkedTaskId],
    })).rows[0];
    return {
      id: existing.id as number,
      taskId: existing.task_id as number,
      linkedTaskId: existing.linked_task_id as number,
      linkType: existing.link_type as LinkType,
      linkedTaskTitle: existing.linked_task_title as string,
    };
  }
  const row = r.rows[0];
  // Fetch title
  const t = (await db.execute({ sql: "SELECT title FROM tasks WHERE id = ?", args: [linkedTaskId] })).rows[0];
  return {
    id: row.id as number,
    taskId: row.task_id as number,
    linkedTaskId: row.linked_task_id as number,
    linkType: row.link_type as LinkType,
    linkedTaskTitle: (t?.title as string) || "",
  };
}

export async function deleteTaskLink(taskId: number, linkId: number): Promise<boolean> {
  await init();
  const db = getClient();
  const r = await db.execute({ sql: "DELETE FROM task_links WHERE id = ? AND task_id = ?", args: [linkId, taskId] });
  return r.rowsAffected > 0;
}

// ── Notification CRUD ──

export async function getNotifications(userName: string, limit: number = 20): Promise<{ id: number; userName: string; type: string; taskId: number | null; text: string; read: boolean; created: string }[]> {
  await init();
  const db = getClient();
  const r = await db.execute({
    sql: "SELECT * FROM notifications WHERE user_name = ? ORDER BY created DESC LIMIT ?",
    args: [userName, limit],
  });
  return r.rows.map((rr) => ({
    id: rr.id as number,
    userName: rr.user_name as string,
    type: rr.type as string,
    taskId: rr.task_id as number | null,
    text: rr.text as string,
    read: (rr.read as number) === 1,
    created: rr.created as string,
  }));
}

export async function getUnreadNotificationCount(userName: string): Promise<number> {
  await init();
  const db = getClient();
  const r = await db.execute({
    sql: "SELECT COUNT(*) as cnt FROM notifications WHERE user_name = ? AND read = 0",
    args: [userName],
  });
  return r.rows[0].cnt as number;
}

export async function createNotification(userName: string, type: string, text: string, taskId: number | null = null): Promise<void> {
  await init();
  const db = getClient();
  // Deduplicate: skip if same notification exists for same user+task+type in last hour
  const recent = await db.execute({
    sql: "SELECT id FROM notifications WHERE user_name = ? AND type = ? AND task_id = ? AND created > datetime('now', '-1 hour')",
    args: [userName, type, taskId],
  });
  if (recent.rows.length === 0) {
    await db.execute({
      sql: "INSERT INTO notifications (user_name, type, task_id, text) VALUES (?, ?, ?, ?)",
      args: [userName, type, taskId, text],
    });
  }
}

export async function markNotificationRead(id: number, userName: string): Promise<boolean> {
  await init();
  const db = getClient();
  const r = await db.execute({
    sql: "UPDATE notifications SET read = 1 WHERE id = ? AND user_name = ?",
    args: [id, userName],
  });
  return r.rowsAffected > 0;
}

export async function markAllNotificationsRead(userName: string): Promise<number> {
  await init();
  const db = getClient();
  const r = await db.execute({
    sql: "UPDATE notifications SET read = 1 WHERE user_name = ? AND read = 0",
    args: [userName],
  });
  return r.rowsAffected;
}

// ── Sessions ──

const SESSION_TTL_HOURS = 8;
const SESSION_RENEW_THRESHOLD_HOURS = 2;

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSession(userId: number): Promise<{ token: string; expiresAt: string }> {
  await init();
  const db = getClient();
  await db.execute({ sql: "DELETE FROM sessions WHERE user_id = ?", args: [userId] });
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const tokenHash = await sha256Hex(token);
  const r = await db.execute({
    sql: `INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, datetime('now', '+${SESSION_TTL_HOURS} hours', 'localtime')) RETURNING expires_at`,
    args: [userId, tokenHash],
  });
  return { token, expiresAt: r.rows[0].expires_at as string };
}

export async function findSessionByToken(rawToken: string): Promise<{ userId: number; expiresAt: string } | null> {
  await init();
  const db = getClient();
  const tokenHash = await sha256Hex(rawToken);
  const r = await db.execute({
    sql: "SELECT user_id, expires_at FROM sessions WHERE token_hash = ? AND expires_at > datetime('now', 'localtime')",
    args: [tokenHash],
  });
  if (r.rows.length === 0) return null;
  return { userId: r.rows[0].user_id as number, expiresAt: r.rows[0].expires_at as string };
}

export async function destroySession(rawToken: string): Promise<boolean> {
  await init();
  const db = getClient();
  const tokenHash = await sha256Hex(rawToken);
  const r = await db.execute({ sql: "DELETE FROM sessions WHERE token_hash = ?", args: [tokenHash] });
  return r.rowsAffected > 0;
}

export async function destroyAllSessionsForUser(userId: number): Promise<number> {
  await init();
  const db = getClient();
  const r = await db.execute({ sql: "DELETE FROM sessions WHERE user_id = ?", args: [userId] });
  return r.rowsAffected;
}

export async function renewSessionIfExpiring(rawToken: string): Promise<void> {
  await init();
  const db = getClient();
  const tokenHash = await sha256Hex(rawToken);
  const r = await db.execute({
    sql: "SELECT (julianday(expires_at) - julianday('now')) * 24 as hours_left FROM sessions WHERE token_hash = ?",
    args: [tokenHash],
  });
  if (r.rows.length === 0) return;
  const hoursLeft = r.rows[0].hours_left as number;
  if (hoursLeft < SESSION_RENEW_THRESHOLD_HOURS) {
    await db.execute({
      sql: `UPDATE sessions SET expires_at = datetime('now', '+${SESSION_TTL_HOURS} hours', 'localtime'), last_used = datetime('now', 'localtime') WHERE token_hash = ?`,
      args: [tokenHash],
    });
  } else {
    await db.execute({
      sql: "UPDATE sessions SET last_used = datetime('now', 'localtime') WHERE token_hash = ?",
      args: [tokenHash],
    });
  }
}

export async function getUserRole(userId: number): Promise<{ name: string; role: string } | null> {
  await init();
  const db = getClient();
  const r = await db.execute({ sql: "SELECT name, role FROM users WHERE id = ?", args: [userId] });
  if (r.rows.length === 0) return null;
  return { name: r.rows[0].name as string, role: r.rows[0].role as string };
}

