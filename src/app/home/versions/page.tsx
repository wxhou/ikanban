"use client";

import VersionPage from "@/components/VersionPage";
import { useApp } from "@/lib/context/app-context";

export default function VersionsPage() {
  const { versions, setVersions } = useApp();

  return <VersionPage versions={versions} onVersionsChange={setVersions} />;
}
