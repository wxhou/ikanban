// Shared helpers for Playwright specs.
import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

export const ADMIN_NAME = "管理员";
export const ADMIN_PASSWORD = "admin123";
export const DEV_NAME = "惠寅初";
export const DEV_PASSWORD = "惠寅初";

/** 通过 API 登录指定用户（page.request 与页面共享 cookie jar，会刷新 sid cookie） */
export async function loginViaApi(page: Page, name: string, password: string): Promise<void> {
  const res = await page.request.post("/api/auth/verify", { data: { name, password } });
  expect(res.ok(), `API login failed for ${name} (${res.status()})`).toBeTruthy();
}

/**
 * 确保当前上下文持有有效会话：先探测 /api/auth/me，仅在会话失效时才重新登录。
 * 登录接口有 5 次/分钟/用户 的限流，不能对每个用例无条件重登。
 */
export async function ensureAuthed(page: Page, name: string, password: string): Promise<void> {
  const probe = await page.request.get("/api/auth/me");
  if (probe.ok()) return;
  await loginViaApi(page, name, password);
}

/** 创建真正无 cookie 的全新上下文（显式清空 storageState，避免继承项目配置） */
export async function createCleanContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({ storageState: { cookies: [], origins: [] } });
}

/** 等待看板就绪（当前用户身份已通过 /api/auth/me 解析完成） */
export async function waitForBoard(page: Page, avatarChar: string): Promise<void> {
  await page.goto("/home/kanban");
  await expect(page.getByTitle("我的待办")).toHaveText(avatarChar);
  await expect(page.getByText("待办", { exact: true }).first()).toBeVisible();
}

/** 通过 HTML5 拖拽事件把任务卡片从一列拖到另一列（Playwright 不支持原生 HTML5 DnD） */
export async function dragCardToColumn(page: Page, taskTitle: string, targetAddBtnIndex: number): Promise<void> {
  const card = page.getByText(taskTitle, { exact: true }).first().locator('xpath=ancestor::div[@draggable="true"]');
  await expect(card).toBeVisible();
  const targetBody = page.getByRole("button", { name: "添加任务" }).nth(targetAddBtnIndex).locator("xpath=..");

  // 在浏览器上下文内用真实 DataTransfer 派发 dragstart，等待 React 处理后再派发 drop
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await card.dispatchEvent("dragstart", { dataTransfer });
  await page.waitForTimeout(300); // 等待 React 状态更新 dragId
  await targetBody.dispatchEvent("dragover", { dataTransfer });
  await targetBody.dispatchEvent("drop", { dataTransfer });
  await page.waitForTimeout(300); // 等待 API 请求与 toast 渲染
}

/** 通过 API 读取任务状态 */
export async function getTaskStatus(page: Page, title: string): Promise<string> {
  const res = await page.request.get("/api/tasks");
  expect(res.ok()).toBeTruthy();
  const tasks = (await res.json()) as { title: string; status: string }[];
  const task = tasks.find((t) => t.title === title);
  expect(task, `task "${title}" not found via API`).toBeTruthy();
  return task!.status;
}