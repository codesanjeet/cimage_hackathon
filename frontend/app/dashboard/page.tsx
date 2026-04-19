"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  RiGroupLine,
  RiDoorOpenLine,
  RiTimeLine,
  RiAlarmWarningLine,
  RiRefreshLine,
  RiCalendarLine,
} from "react-icons/ri";
import StatCard from "@/components/StatCard";
import DashboardShell from "@/components/DashboardShell";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getDashboardStats, DashboardStats } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function DashboardPage() {
  const [stats, setStats]     = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [today, setToday] = useState("");
  const { showToast } = useToast();

const fetchStats = async () => {
  setLoading(true);
  try {
    const data = await getDashboardStats();
    console.log("[DASHBOARD DEBUG] Raw API response:", data);
    setStats(data);
    setLastRefresh(new Date());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load stats";
    showToast(msg, "error");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { fetchStats(); }, []);

useEffect(() => {
  fetchStats();
  // Set date client-side only — avoids SSR/client locale mismatch
  setToday(new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }));
}, []);

  return (
    <DashboardShell
      title="Security Dashboard"
      subtitle={today}
      actions={
        <button
          onClick={fetchStats}
          disabled={loading}
          className="vms-btn-ghost text-xs gap-1.5"
        >
          <RiRefreshLine className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      }
    >
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="vms-card p-5 mb-6 flex items-center gap-4 overflow-hidden relative"
      >
        <div className="absolute right-0 top-0 w-48 h-full opacity-10 bg-gradient-to-l from-indigo-600 to-transparent" />
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
          <RiCalendarLine className="text-indigo-400 text-2xl" />
        </div>
        <div>
          <p className="font-semibold text-white">Live Visitor Overview</p>
          <p className="text-sm text-gray-400">Real-time campus entry tracking and security monitoring.</p>
        </div>
        {lastRefresh && (
          <p className="ml-auto text-[11px] text-gray-600 hidden sm:block flex-shrink-0">
            Updated {lastRefresh.toLocaleTimeString()}
          </p>
        )}
      </motion.div>

      {/* Stat cards */}
      {loading && !stats ? (
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner size="lg" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard
            label="Total Visitors Today"
            value={stats.total_visitors_today}
            icon={<RiGroupLine />}
            accent="indigo"
            delay={0}
          />
          <StatCard
            label="Active Inside"
            value={stats.active_inside}
            icon={<RiDoorOpenLine />}
            accent="emerald"
            delay={0.1}
          />
          <StatCard
            label="Pending Approvals"
            value={stats.pending_approvals}
            icon={<RiTimeLine />}
            accent="yellow"
            delay={0.2}
          />
          <StatCard
            label="Overstayed"
            value={stats.overstayed}
            icon={<RiAlarmWarningLine />}
            accent="red"
            delay={0.3}
          />
        </div>
      ) : null}

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 vms-card p-5"
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Register Visitor",  href: "/visitors/register", color: "indigo" },
            { label: "View Visitors",     href: "/visitors",          color: "blue"   },
            { label: "Check Alerts",      href: "/alerts",            color: "orange" },
            { label: "AI Risk Analysis",  href: "/ai",                color: "purple" },
          ].map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="vms-card px-4 py-3.5 text-center text-sm font-medium text-gray-300 hover:text-white hover:border-indigo-500/30 hover:bg-indigo-600/5 transition-all duration-200"
            >
              {a.label}
            </a>
          ))}
        </div>
      </motion.div>
    </DashboardShell>
  );
}