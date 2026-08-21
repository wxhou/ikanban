// Task 6.2 — 认证验证
// 覆盖：未登录守卫重定向、UI 登录进入默认视图、登出后守卫仍拦截、会话过期重新登录
import { test, expect } from "@playwright/test";
import { createCleanContext, loginViaApi } from "./helpers";

// 登出/会话过期/UI 登录用例使用不同用户，避免销毁共享 admin 会话（createSession 会删除该用户全部旧会话）
// 且分散登录请求，避免触发 5 次/分钟/用户 的登录限流
const UI_LOGIN_USER = "杨丽";
const UI_LOGIN_PASSWORD = "杨丽";
const LOGOUT_USER = "毕浩";
const LOGOUT_PASSWORD = "毕浩";
const SESSION_USER = "简婷";
const SESSION_PASSWORD = "简婷";

test.describe("认证守卫", () => {
  test("未登录访问受保护页重定向到 /login 且无业务数据", async ({ browser }) => {
    // 显式清空 storageState，确保真正无 cookie 的访客上下文
    const context = await createCleanContext(browser);
    const page = await context.newPage();

    await page.goto("/home/kanban");
    await expect(page).toHaveURL(/\/login/);

    // 响应不含业务数据：无看板列、无任务卡片、无搜索框
    await expect(page.getByText("待办", { exact: true })).toHaveCount(0);
    await expect(page.getByText("完成首页 UI 设计稿")).toHaveCount(0);
    await expect(page.locator("#search-input")).toHaveCount(0);

    await context.close();
  });

  test("UI 登录成功进入默认视图 /home/kanban", async ({ browser }) => {
    // 登录页会重定向已登录用户，必须用无 cookie 的干净上下文
    const context = await createCleanContext(browser);
    const page = await context.newPage();

    await page.goto("/login");

    // 选择杨丽账户（避免销毁共享 admin 会话，触发登录限流）
    await page.getByRole("button", { name: new RegExp(UI_LOGIN_USER) }).click();
    await expect(page.getByText("输入密码以继续")).toBeVisible();

    // 输入密码并确认登录
    await page.getByPlaceholder("请输入密码").fill(UI_LOGIN_PASSWORD);
    await page.getByRole("button", { name: "确认登录" }).click();

    // 登录成功跳转默认视图
    await expect(page).toHaveURL(/\/home\/kanban/);
    await expect(page.getByText("待办", { exact: true }).first()).toBeVisible();
    await expect(page.getByTitle("退出登录")).toBeVisible();

    await context.close();
  });

  test("登出回到登录页，再访问受保护页仍被守卫拦截", async ({ page }) => {
    // 使用独立用户登录，避免销毁共享 admin 会话
    await loginViaApi(page, LOGOUT_USER, LOGOUT_PASSWORD);
    await page.goto("/home/kanban");
    await expect(page.getByTitle("退出登录")).toBeVisible();

    // 点击 TopNav 登出按钮
    await page.getByTitle("退出登录").click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("button", { name: /毕浩/ })).toBeVisible();

    // 登出后访问受保护页仍被拦截
    await page.goto("/home/kanban");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("待办", { exact: true })).toHaveCount(0);
  });

  test("会话过期（清 cookie）后重新登录可恢复访问", async ({ page }) => {
    await loginViaApi(page, SESSION_USER, SESSION_PASSWORD);
    await page.goto("/home/kanban");
    await expect(page.getByTitle("退出登录")).toBeVisible();

    // 模拟会话过期：清空所有 cookie
    await page.context().clearCookies();
    await page.goto("/home/kanban");
    await expect(page).toHaveURL(/\/login/);

    // 通过 API 重新登录（page.request 与页面共享 cookie jar）
    await loginViaApi(page, SESSION_USER, SESSION_PASSWORD);

    await page.goto("/home/kanban");
    await expect(page).toHaveURL(/\/home\/kanban/);
    await expect(page.getByTitle("退出登录")).toBeVisible();
  });
});