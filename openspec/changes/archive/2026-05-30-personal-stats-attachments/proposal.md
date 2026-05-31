# 个人待办 + 甲方统计 + 附件上传

## 1. 个人待办面板

- TopNav 头像变为可点击，弹出下拉面板
- 列出"我的任务"：按截止日期排序，逾期 > 今天 > 本周
- 每项显示：标题、截止日期、当前列
- 点击跳转到看板对应列

## 2. 甲方专属统计

- Dashboard 新增"甲方任务进度"面板
- FilterBar 选"甲方任务"时自动展示
- 显示：待处理/进行中/已完成 统计
- 环形/进度条展示

## 3. 附件上传（评论附图片）

- 备注输入框旁新增附件按钮
- 支持图片上传，存储到 data/uploads/
- 图片预览 + 点击放大
- 列表显示缩略图

## 文件变更

```
新增:
  src/components/MyTasks.tsx
  src/components/MyTasks.module.css
  src/app/api/uploads/route.ts

修改:
  src/lib/types.ts        — Comment 加 images 字段
  src/lib/db.ts           — comments 表加 images 列
  src/components/TopNav/TopNav.tsx       — 头像点击弹出
  src/components/Dashboard.tsx           — 甲方统计
  src/components/TaskModal/TaskModal.tsx  — 附件上传
```
