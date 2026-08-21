"use client";

import { useRouter } from "next/navigation";
import LoginPage from "@/components/LoginPage";

interface User {
  id: number;
  name: string;
  avatar: string;
  role: string;
}

// LoginPage 内部只负责认证，不处理跳转；此处包一层 client 组件，
// 登录成功后跳转到默认视图 /home/kanban。
export default function LoginClient({ users }: { users: User[] }) {
  const router = useRouter();
  return <LoginPage users={users} onLogin={() => router.push("/home/kanban")} />;
}