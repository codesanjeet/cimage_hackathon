"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { RiUserLine, RiShieldCheckLine } from "react-icons/ri";

interface DashboardShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function DashboardShell({ title, subtitle, children, actions }: DashboardShellProps) {
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const name = localStorage.getItem("name");
    const role = localStorage.getItem("role");
    // Redirect to login if not authenticated
    if (!localStorage.getItem("access_token")) {
      router.replace("/login");
      return;
    }
    setUserName(name);
    setUserRole(role);
  }, [router]);

  return (
    <div className="vms-page">
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-[#0f1117]/80 backdrop-blur-md border-b border-white/5 md:ml-0">
          {/* Page title — indent on mobile for hamburger */}
          <div className="pl-12 md:pl-0">
            <h2 className="text-lg font-bold text-white leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            {actions}
            {/* User pill */}
            {userName && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
                  <RiUserLine className="text-indigo-400 text-xs" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-gray-200 leading-tight">{userName}</p>
                  {userRole && (
                    <p className="text-[10px] text-gray-500 capitalize">{userRole}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}