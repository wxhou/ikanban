export interface Task {
  id: number;
  title: string;
  desc: string;
  status: TaskStatus;
  priority: TaskPriority;
  source: TaskSource;
  requester: string | null;
  assignees: string[];
  due: string | null;
  created: string;
  updated: string;
}

export type TaskStatus = "todo" | "inprogress" | "review" | "blocked" | "done";
export type TaskPriority = "high" | "medium" | "low";
export type TaskSource = "jiafang" | "internal";

export const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "待办" },
  { id: "inprogress", label: "进行中" },
  { id: "review", label: "审核中" },
  { id: "blocked", label: "已阻塞" },
  { id: "done", label: "已完成" },
];

export const TEAM_MEMBERS = ["张三", "李四", "王五", "赵六", "钱七", "孙八"];
export const JIAFANG_SOURCES = ["需求对接人", "项目对接人"];
