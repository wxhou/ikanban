"use client";

import { useMemo } from "react";
import Report from "@/components/Report";
import { useApp } from "@/lib/context/app-context";
import { filterTasksByRole } from "@/utils";

export default function ReportPage() {
  const { tasks, currentUser, currentUserRole } = useApp();

  const effectiveTasks = useMemo(() => {
    if (!currentUser || !currentUserRole) return tasks;
    return filterTasksByRole(tasks, currentUser, currentUserRole);
  }, [tasks, currentUser, currentUserRole]);

  return <Report tasks={effectiveTasks} />;
}
