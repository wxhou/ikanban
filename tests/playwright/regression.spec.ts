// Task 6.3 — 核心交互回归
// 覆盖：拖拽移动任务、任务编辑/删除、通知点击打开任务、我的待办、用户管理、键盘快捷键
import { test, expect } from "@playwright/test";
import {
  ADMIN_NAME,
  ADMIN_PASSWORD,
  DEV_NAME,
  DEV_PASSWORD,
  ensureAuthed,
  loginViaApi,
  waitForBoard,
  dragCardToColumn,
  getTaskStatus,
} from "./helpers";

test.describe("核心交互回归", () => {
  // 每个用例前确保 admin 会话有效（仅在失效时重新登录，避免触发登录限流）
  test.beforeEach(async ({ page }) => {
    await ensureAuthed(page, ADMIN_NAME, ADMIN_PASSWORD);
  });

  test("拖拽移动任务到另一列并断言状态变化", async ({ page }) => {
    const TASK = "集成测试报告撰写";
    await waitForBoard(page, "管");

    // 通过 API 将任务重置为 todo，确保初始状态确定（上次失败运行可能残留其他状态）
    const tasksRes = await page.request.get("/api/tasks");
    const allTasks = (await tasksRes.json()) as { id: number; title: string }[];
    const task = allTasks.find((t) => t.title === TASK)!;
    await page.request.patch(`/api/tasks/${task.id}`, { data: { status: "todo" } });
    await page.reload();
    await expect(page.getByText("待办", { exact: true }).first()).toBeVisible();

    // 初始状态：任务在待办列
    expect(await getTaskStatus(page, TASK)).toBe("todo");

    // 拖到「进行中」列（第 2 列，index=1）
    await dragCardToColumn(page, TASK, 1);
    // 断言状态变化（API 确认 + 卡片已移动到进行中列）
    expect(await getTaskStatus(page, TASK)).toBe("inprogress");
    const movedCard = page.getByText(TASK, { exact: true }).first().locator('xpath=ancestor::div[@draggable="true"]');
    await expect(movedCard.locator("xpath=ancestor::div[contains(@class,'col')]").getByText("进行中", { exact: true })).toBeVisible();

    // 拖回「待办」列（第 1 列，index=0）恢复现场
    await dragCardToColumn(page, TASK, 0);
    expect(await getTaskStatus(page, TASK)).toBe("todo");
    const restoredCard = page.getByText(TASK, { exact: true }).first().locator('xpath=ancestor::div[@draggable="true"]');
    await expect(restoredCard.locator("xpath=ancestor::div[contains(@class,'col')]").getByText("待办", { exact: true })).toBeVisible();
  });

  test("任务编辑：打开 TaskModal 修改标题并保存", async ({ page }) => {
    const ORIGINAL = "集成测试报告撰写";
    const EDITED = `集成测试报告撰写-E2E编辑-${Date.now()}`;
    await waitForBoard(page, "管");

    // 打开任务编辑 modal
    const card = page.getByText(ORIGINAL, { exact: true }).first().locator('xpath=ancestor::div[@draggable="true"]');
    await card.getByTitle("编辑").click();
    await expect(page.getByRole("dialog", { name: "编辑任务" })).toBeVisible();

    // 修改标题并保存
    const titleInput = page.getByPlaceholder("简要描述任务内容");
    await titleInput.fill(EDITED);
    await page.getByRole("button", { name: "保存修改" }).click();

    // 断言保存成功且新标题出现在看板
    await expect(page.getByText("保存成功")).toBeVisible();
    await expect(page.getByText(EDITED, { exact: true }).first()).toBeVisible();

    // 还原标题
    const editedCard = page.getByText(EDITED, { exact: true }).first().locator('xpath=ancestor::div[@draggable="true"]');
    await editedCard.getByTitle("编辑").click();
    await expect(page.getByRole("dialog", { name: "编辑任务" })).toBeVisible();
    await page.getByPlaceholder("简要描述任务内容").fill(ORIGINAL);
    await page.getByRole("button", { name: "保存修改" }).click();
    await expect(page.getByText("保存成功")).toBeVisible();
    await expect(page.getByText(ORIGINAL, { exact: true }).first()).toBeVisible();
  });

  test("任务删除：创建任务后通过 modal 删除", async ({ page }) => {
    const TITLE = `E2E待删除-${Date.now()}`;
    await waitForBoard(page, "管");

    // 通过 API 创建任务（避免破坏种子数据）
    const createRes = await page.request.post("/api/tasks", {
      data: {
        title: TITLE,
        desc: "E2E 删除测试用任务",
        status: "todo",
        priority: "medium",
        source: "internal",
        requester: null,
        assignees: [ADMIN_NAME],
        tags: [],
        versionId: null,
        due: null,
      },
    });
    expect(createRes.status()).toBe(201);
    const created = (await createRes.json()) as { id: number };
    expect(created.id).toBeTruthy();

    // 刷新看板使新任务出现
    await page.reload();
    await expect(page.getByText(TITLE, { exact: true }).first()).toBeVisible();

    // 打开 modal 并删除（处理 confirm 对话框）
    const card = page.getByText(TITLE, { exact: true }).first().locator('xpath=ancestor::div[@draggable="true"]');
    await card.getByTitle("编辑").click();
    await expect(page.getByRole("dialog", { name: "编辑任务" })).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "删除" }).click();

    // 断言删除成功：toast + 卡片消失 + API 确认
    await expect(page.getByText("已删除")).toBeVisible();
    await expect(page.getByText(TITLE, { exact: true })).toHaveCount(0);
    const res = await page.request.get("/api/tasks");
    const tasks = (await res.json()) as { id: number }[];
    expect(tasks.some((t) => t.id === created.id)).toBeFalsy();
  });

  test("通知点击打开对应任务 modal", async ({ browser }) => {
    const context = await browser.newContext();
    const devPage = await context.newPage();
    await loginViaApi(devPage, DEV_NAME, DEV_PASSWORD);
    await waitForBoard(devPage, "惠");

    // 打开通知面板
    await devPage.getByTitle("通知中心").click();
    await expect(devPage.getByText("通知中心")).toBeVisible();

    // 点击第一条通知
    const notif = devPage.getByText(/任务「.+」/).first();
    await expect(notif).toBeVisible();
    const title = (await notif.textContent())!.match(/「(.+?)」/)![1];

    await notif.click();

    // 断言任务 modal 打开且显示对应任务标题
    await expect(devPage.getByRole("dialog")).toBeVisible();
    await expect(devPage.getByPlaceholder("简要描述任务内容")).toHaveValue(title);

    await context.close();
  });

  test("我的待办：打开 overlay 并断言显示当前用户任务", async ({ browser }) => {
    const context = await browser.newContext();
    const devPage = await context.newPage();
    await loginViaApi(devPage, DEV_NAME, DEV_PASSWORD);
    await waitForBoard(devPage, "惠");

    // 点击头像打开我的待办
    await devPage.getByTitle("我的待办").click();
    const panel = devPage.getByText("我的待办", { exact: true }).last().locator("xpath=ancestor::div[contains(@class,'panel')]");
    await expect(panel).toBeVisible();

    // 断言显示分配给惠寅初的任务（限定在面板内，避免与看板卡片重复匹配）
    await expect(panel.getByText("完成首页 UI 设计稿", { exact: true })).toBeVisible();
    await expect(panel.getByText("集成测试报告撰写", { exact: true })).toBeVisible();
    await expect(panel.getByText("上线审批流程确认", { exact: true })).toBeVisible();

    await context.close();
  });

  test("用户管理：admin 打开 UserManagement 并断言用户列表", async ({ page }) => {
    await waitForBoard(page, "管");

    // 用户管理按钮仅 admin 可见
    await expect(page.getByRole("button", { name: "用户管理" })).toBeVisible();
    await page.getByRole("button", { name: "用户管理" }).click();

    // 断言 modal 标题与用户列表（限定在 modal 内，避免与 TopNav 按钮重复匹配）
    const modal = page.getByRole("heading", { name: "用户管理" }).locator("xpath=ancestor::div[contains(@class,'modal')]");
    await expect(modal).toBeVisible();
    for (const name of ["管理员", "惠寅初", "侯伟轩", "杨丽", "简婷", "毕浩", "王官豪", "袁明亮"]) {
      await expect(modal.getByText(name, { exact: true }).first()).toBeVisible();
    }
  });

  test("键盘快捷键：n 打开新建 modal，/ 聚焦搜索框", async ({ page }) => {
    await waitForBoard(page, "管");

    // n → 新建任务 modal
    await page.keyboard.press("n");
    await expect(page.getByRole("dialog", { name: "新建任务" })).toBeVisible();

    // 关闭 modal
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "新建任务" })).toHaveCount(0);

    // / → 聚焦搜索框
    await page.keyboard.press("/");
    await expect(page.locator("#search-input")).toBeFocused();
  });
});