export interface Subtask {
  id: number;
  taskId: number;
  text: string;
  done: boolean;
  sortOrder: number;
}

export interface Comment {
  id: number;
  taskId: number;
  user: string;
  text: string;
  images: string;
  created: string;
}

export type LinkType = "blocks" | "blocked_by" | "related";

export interface TaskLink {
  id: number;
  taskId: number;
  linkedTaskId: number;
  linkType: LinkType;
  linkedTaskTitle?: string;
}

export interface Notification {
  id: number;
  userName: string;
  type: NotificationType;
  taskId: number | null;
  text: string;
  read: boolean;
  created: string;
  audience: "team" | "portal";
}

export type NotificationType = "assigned" | "due_soon" | "overdue" | "commented" | "completed";

export interface Version {
  id: number;
  name: string;
  status: "active" | "closed";
  description: string;
  created: string;
}

export interface Task {
  id: number;
  title: string;
  desc: string;
  status: TaskStatus;
  priority: TaskPriority;
  source: TaskSource;
  requester: string | null;
  assignees: string[];
  versionId: number | null;
  due: string | null;
  created: string;
  updated: string;
  subtasks: Subtask[];
  comments: Comment[];
  tags: string[];
  linkedTasks?: TaskLink[];
}

export type TaskStatus = "todo" | "inprogress" | "review" | "verifying" | "blocked" | "done";
export type TaskPriority = "high" | "medium" | "low";
export type TaskSource = "jiafang" | "internal";

export const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "待办" },
  { id: "inprogress", label: "进行中" },
  { id: "review", label: "审核中" },
  { id: "verifying", label: "待验收" },
  { id: "blocked", label: "已阻塞" },
  { id: "done", label: "已完成" },
];

export const JIAFANG_SOURCES = ["需求对接人", "项目对接人"];
