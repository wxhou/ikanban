"use client";

import { useMemo } from "react";
import KanbanBoard from "@/components/KanbanBoard";
import { useApp } from "@/lib/context/app-context";
import { useUI } from "@/lib/context/ui-context";
import { canSeeJiafangSource, filterTasksByRole } from "@/utils";

export default function KanbanPage() {
  const {
    tasks, setTasks,
    versions, activeVersionId, setActiveVersionId,
    currentUser, currentUserRole,
  } = useApp();
  const { openTask, modalTask } = useUI();

  const activeVersion = useMemo(
    () => versions.find((v) => v.id === activeVersionId),
    [versions, activeVersionId],
  );
  const readonly = activeVersion?.status === "closed";

  // 与原 App.tsx 的 effectiveTasks 一致：按角色过滤后再传给看板
  const effectiveTasks = useMemo(
    () => (currentUser && currentUserRole ? filterTasksByRole(tasks, currentUser, currentUserRole) : tasks),
    [tasks, currentUser, currentUserRole],
  );

  return (
    <KanbanBoard
      initialTasks={effectiveTasks}
      onEditTask={(t) => openTask(t, false)}
      onViewTask={(t) => openTask(t, true)}
      onTasksChange={setTasks}
      versions={versions}
      activeVersionId={activeVersionId}
      onVersionChange={setActiveVersionId}
      readonly={readonly}
      currentUser={currentUser ?? ""}
      showJiafangFilter={currentUserRole ? canSeeJiafangSource(currentUserRole) : true}
      modalTask={modalTask}
    />
  );
}
