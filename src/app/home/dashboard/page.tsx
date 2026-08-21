"use client";

import { useMemo } from "react";
import Dashboard from "@/components/Dashboard";
import { useApp } from "@/lib/context/app-context";
import { filterTasksByRole } from "@/utils";

export default function DashboardPage() {
  const { tasks, members, currentUser, currentUserRole } = useApp();

  const effectiveTasks = useMemo(() => {
    if (!currentUser || !currentUserRole) return tasks;
    return filterTasksByRole(tasks, currentUser, currentUserRole);
  }, [tasks, currentUser, currentUserRole]);

  return <Dashboard tasks={effectiveTasks} members={members} />;
}
