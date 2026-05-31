## 1. 依赖与基础设施

- [x] 1.1 安装 bcryptjs 依赖
- [x] 1.2 在 db.ts 中添加 `hashPassword` 和 `comparePassword` 辅助函数

## 2. 密码安全升级

- [x] 2.1 修改 `verifyUserPassword`：bcrypt.compare 优先，失败后 fallback 明文比较，明文匹配时自动升级哈希
- [x] 2.2 修改 `setUserInitialPassword`：存储前 bcrypt 哈希
- [x] 2.3 修改 `createUser`：password 参数非空时哈希存储
- [x] 2.4 修改 `updateUser`：password 字段变更时哈希存储
- [x] 2.5 更新 seed 数据中管理员密码为哈希值，普通用户默认密码为哈希值

## 3. 团队成员动态化

- [x] 3.1 删除 `types.ts` 中的 `TEAM_MEMBERS` 硬编码常量
- [x] 3.2 新增 `GET /api/users/members` 接口，返回非管理员用户名列表
- [x] 3.3 修改 `App.tsx`：启动时 fetch members 列表，通过 context 或 prop 传递
- [x] 3.4 修改 `Dashboard.tsx`：团队负载区块使用动态成员列表
- [x] 3.5 修改 `TaskModal.tsx`：负责人下拉使用动态成员列表
- [x] 3.6 修改 `FilterBar.tsx`（如有 TEAM_MEMBERS 引用）使用动态成员列表

## 4. API 分页支持

- [x] 4.1 修改 `db.ts` 中 `getAllTasks`：支持可选 page/pageSize 参数，返回带分页元数据的结果
- [x] 4.2 修改 `GET /api/tasks`：解析 query 参数，传分页参数时返回 `{ data, total, page, pageSize }`，不传时返回 `Task[]`
- [x] 4.3 修改 `GET /api/portal/tasks`：支持相同分页参数格式

## 5. 批量操作

- [x] 5.1 新增 `POST /api/tasks/batch` 接口：接收 `{ ids, updates }`，批量更新任务
- [x] 5.2 在 `db.ts` 中添加 `batchUpdateTasks` 函数
- [x] 5.3 在 `KanbanBoard.tsx` 中实现多选模式（Ctrl/Cmd + 点击选中任务）
- [x] 5.4 在看板 UI 中添加批量操作工具栏（选中后显示状态修改选项）

## 6. 验证

- [x] 6.1 TypeScript 类型检查通过（`npx tsc --noEmit`）
- [x] 6.2 密码哈希功能验证：新设密码、旧密码登录、自动迁移均正常
- [x] 6.3 团队成员动态加载验证：成员列表从 API 获取，无硬编码引用
- [x] 6.4 分页功能验证：有分页参数和无分页参数的请求均正常返回
- [x] 6.5 批量操作验证：多选任务后批量修改状态正常
