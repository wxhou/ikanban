## Why

当前总览页和汇报页功能重叠严重、定位模糊。总览页堆砌所有管理指标缺乏焦点，汇报页只是列表+导出过于单薄。甲方客户缺少专属视图——他们只关心"现在在做什么，还有多少没做"，不应该看到用户管理、内部任务等无关内容。

## What Changes

- 新增 `/portal` 路由：甲方专属门户页，无需登录，展示甲方任务（当前进行中 + 待完成 + 已交付），支持评论反馈和版本切换
- 总览页精简：移除甲方任务统计、完成进度条，聚焦于全局管理指标（统计卡片、逾期预警、人员负载、任务清单）
- 汇报页重构：保留为 PM 的全局任务表格和 CSV 导出工具，移除甲方专属内容
- 统一术语：「备注」→「评论」

## Capabilities

### New Capabilities

- `client-portal`: 甲方门户页，独立路由 `/portal`，无需认证，展示甲方任务的核心进度信息并支持评论和版本切换

### Modified Capabilities

- `dashboard`: 移除甲方任务统计卡片、甲方完成进度条，聚焦于全局管理面板

## Impact

- 新增 `src/app/portal/page.tsx`（甲方门户页）+ 对应 CSS Module
- 修改 `src/app/page.tsx`（需支持 portal 路由独立渲染）
- 修改 `src/components/Dashboard.tsx`（移除甲方专属区块）
- 修改 `src/components/Report.tsx`（重构为 PM 汇报工具）
- 修改 `src/components/TaskCard/TaskCard.tsx`（评论术语统一已完成）
- 修改 `openspec/specs/dashboard/spec.md`（移除甲方进度相关内容）
