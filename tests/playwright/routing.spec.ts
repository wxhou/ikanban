// Task 6.1 — 视图路由验证
// 覆盖：四视图直达渲染、根路径重定向、刷新保持、浏览器前进/后退、分享链接筛选参数
import { test, expect } from "@playwright/test";
import { ADMIN_NAME, ADMIN_PASSWORD, ensureAuthed } from "./helpers";

test.describe("视图路由", () => {
  // 每个用例前确保会话有效（仅在失效时重新登录，避免触发登录限流）
  test.beforeEach(async ({ page }) => {
    await ensureAuthed(page, ADMIN_NAME, ADMIN_PASSWORD);
  });
  test("四个视图 URL 直接访问均正常渲染对应视图", async ({ page }) => {
    // 看板视图：断言看板列与任务卡片
    await page.goto("/home/kanban");
    await expect(page.getByText("待办", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("进行中", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("已完成", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("完成首页 UI 设计稿").first()).toBeVisible();

    // 总览视图：断言统计卡片与标题
    await page.goto("/home/dashboard");
    await expect(page.getByRole("heading", { name: "项目全局概览" })).toBeVisible();
    await expect(page.getByText("总任务数", { exact: true })).toBeVisible();
    await expect(page.getByText("完成率", { exact: true })).toBeVisible();

    // 汇报视图：断言表格
    await page.goto("/home/report");
    await expect(page.getByRole("heading", { name: "任务汇报" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "任务名称" })).toBeVisible();
    await expect(page.getByText("导出 CSV")).toBeVisible();

    // 版本视图：断言版本列表
    await page.goto("/home/versions");
    await expect(page.getByRole("heading", { name: "版本历史" })).toBeVisible();
    await expect(page.getByText("V3.1", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("V3.0", { exact: true }).first()).toBeVisible();
  });

  test("/ 与 /home 均重定向到 /home/kanban", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/home\/kanban/);
    await expect(page.getByText("待办", { exact: true }).first()).toBeVisible();

    await page.goto("/home");
    await expect(page).toHaveURL(/\/home\/kanban/);
    await expect(page.getByText("待办", { exact: true }).first()).toBeVisible();
  });

  test("刷新后保持当前视图", async ({ page }) => {
    await page.goto("/home/dashboard");
    await expect(page.getByRole("heading", { name: "项目全局概览" })).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(/\/home\/dashboard/);
    await expect(page.getByRole("heading", { name: "项目全局概览" })).toBeVisible();
  });

  test("浏览器后退/前进在视图间切换正常", async ({ page }) => {
    await page.goto("/home/kanban");
    await expect(page.getByText("待办", { exact: true }).first()).toBeVisible();

    // 通过 TopNav 导航到总览
    await page.getByRole("link", { name: /总览/ }).click();
    await expect(page).toHaveURL(/\/home\/dashboard/);
    await expect(page.getByRole("heading", { name: "项目全局概览" })).toBeVisible();

    // 后退回看板
    await page.goBack();
    await expect(page).toHaveURL(/\/home\/kanban/);
    await expect(page.getByText("待办", { exact: true }).first()).toBeVisible();

    // 前进回总览
    await page.goForward();
    await expect(page).toHaveURL(/\/home\/dashboard/);
    await expect(page.getByRole("heading", { name: "项目全局概览" })).toBeVisible();
  });

  test("分享链接直达视图：URL 筛选与搜索参数被应用", async ({ page }) => {
    await page.goto("/home/kanban?f=jiafang&q=巡检");

    // 搜索框读入 q=巡检
    await expect(page.locator("#search-input")).toHaveValue("巡检");

    // URL 保持筛选参数（KanbanBoard 通过 replaceState 回写；q 参数为 URL 编码形式）
    await expect(page).toHaveURL(/f=jiafang/);
    expect(new URL(page.url()).searchParams.get("q")).toBe("巡检");

    // 筛选+搜索同时生效：种子数据无「巡检」任务 → 过滤后为 0，计数显示 "0 / N 个任务"
    await expect(page.getByText(/0 \/ \d+ 个任务/)).toBeVisible();

    // 所有看板列均为空态
    await expect(page.getByText("暂无任务")).toHaveCount(6);
  });
});