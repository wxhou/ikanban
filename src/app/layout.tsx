import type { Metadata } from "next";
import AgentationWrapper from "@/components/AgentationWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "项目看板 — 全局管理",
  description: "管理项目任务的看板系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <AgentationWrapper />
      </body>
    </html>
  );
}
