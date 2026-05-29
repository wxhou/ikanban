import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { Task } from "./types";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "kanban.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        title      TEXT NOT NULL,
        desc       TEXT DEFAULT '',
        status     TEXT NOT NULL DEFAULT 'todo',
        priority   TEXT NOT NULL DEFAULT 'medium',
        source     TEXT NOT NULL DEFAULT 'internal',
        requester  TEXT,
        assignees  TEXT NOT NULL DEFAULT '[]',
        due        TEXT,
        created    TEXT NOT NULL DEFAULT (date('now')),
        updated    TEXT NOT NULL DEFAULT (date('now'))
      )
    `);
    seedIfEmpty(_db);
  }
  return _db;
}

function seedIfEmpty(db: Database.Database): void {
  const row = db.prepare("SELECT COUNT(*) as cnt FROM tasks").get() as { cnt: number };
  if (row.cnt > 0) return;

  const insert = db.prepare(`
    INSERT INTO tasks (title, desc, status, priority, source, requester, assignees, due, created)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seeds: Omit<Task, "id" | "updated">[] = [
    { title: "完成首页 UI 设计稿", desc: "参照 Figma 设计规范，完成甲方要求的首页 UI 初稿", status: "done", priority: "high", source: "jiafang", requester: "需求对接人", assignees: ["张三"], due: "2026-05-10", created: "2026-05-01" },
    { title: "登录模块接口对接", desc: "与甲方 SSO 系统对接，完成 OAuth 认证流程", status: "inprogress", priority: "high", source: "jiafang", requester: "项目对接人", assignees: ["李四", "王五"], due: "2026-05-18", created: "2026-05-05" },
    { title: "数据库结构设计", desc: "根据需求文档设计项目数据库 ER 图", status: "review", priority: "medium", source: "internal", requester: null, assignees: ["赵六"], due: "2026-05-20", created: "2026-05-03" },
    { title: "导出功能 BUG 修复", desc: "Excel 导出时数字精度丢失问题", status: "blocked", priority: "high", source: "internal", requester: null, assignees: ["王五"], due: "2026-05-15", created: "2026-05-08" },
    { title: "集成测试报告撰写", desc: "汇总各模块测试结果，形成整体报告", status: "todo", priority: "medium", source: "jiafang", requester: "需求对接人", assignees: ["张三"], due: "2026-05-28", created: "2026-05-10" },
    { title: "部署文档编写", desc: "整理部署步骤与常见问题处理方案", status: "todo", priority: "low", source: "internal", requester: null, assignees: ["钱七"], due: "2026-06-01", created: "2026-05-11" },
    { title: "性能优化压测", desc: "压测 500 并发下的接口响应时间", status: "inprogress", priority: "medium", source: "internal", requester: null, assignees: ["李四"], due: "2026-05-22", created: "2026-05-09" },
    { title: "第三方支付对接", desc: "支付宝/微信支付接口集成", status: "todo", priority: "high", source: "jiafang", requester: "项目对接人", assignees: ["孙八"], due: "2026-05-25", created: "2026-05-12" },
    { title: "上线审批流程确认", desc: "与甲方确认正式环境上线审批流程", status: "review", priority: "high", source: "jiafang", requester: "项目对接人", assignees: ["张三", "赵六"], due: "2026-05-17", created: "2026-05-06" },
    { title: "项目周报模板", desc: "制作标准化周报模板供甲方每周汇报使用", status: "done", priority: "low", source: "jiafang", requester: "需求对接人", assignees: ["钱七"], due: "2026-05-08", created: "2026-05-01" },
  ];

  const tx = db.transaction(() => {
    for (const s of seeds) {
      insert.run(s.title, s.desc, s.status, s.priority, s.source, s.requester, JSON.stringify(s.assignees), s.due, s.created);
    }
  });
  tx();
}

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as number,
    title: row.title as string,
    desc: row.desc as string,
    status: row.status as Task["status"],
    priority: row.priority as Task["priority"],
    source: row.source as Task["source"],
    requester: row.requester as string | null,
    assignees: JSON.parse(row.assignees as string) as string[],
    due: row.due as string | null,
    created: row.created as string,
    updated: row.updated as string,
  };
}

export function getAllTasks(): Task[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM tasks ORDER BY id").all() as Record<string, unknown>[];
  return rows.map(rowToTask);
}

export function createTask(task: Omit<Task, "id" | "created" | "updated">): Task {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO tasks (title, desc, status, priority, source, requester, assignees, due)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    task.title,
    task.desc,
    task.status,
    task.priority,
    task.source,
    task.requester,
    JSON.stringify(task.assignees),
    task.due,
  );
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid) as Record<string, unknown>;
  return rowToTask(row);
}

export function updateTask(id: number, fields: Partial<Omit<Task, "id" | "created" | "updated">>): Task | null {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Record<string, unknown> | null;
  if (!existing) return null;

  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, value] of Object.entries(fields)) {
    if (key === "id" || key === "created" || key === "updated") continue;
    sets.push(`${key} = ?`);
    values.push(key === "assignees" ? JSON.stringify(value) : (value as string | number | null));
  }

  if (sets.length === 0) return rowToTask(existing);

  sets.push("updated = date('now')");
  values.push(id);

  db.prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Record<string, unknown>;
  return rowToTask(row);
}
