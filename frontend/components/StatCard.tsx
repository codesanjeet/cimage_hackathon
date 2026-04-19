"use client";
// components/StatCard.tsx

import { motion } from "framer-motion";
import React from "react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: string;
  delay?: number;
}

export default function StatCard({ label, value, icon, accent = "indigo", delay = 0 }: StatCardProps) {
  const accentMap: Record<string, string> = {
    indigo:  "from-indigo-600/20  to-indigo-600/5  border-indigo-500/20  text-indigo-400",
    emerald: "from-emerald-600/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400",
    yellow:  "from-yellow-600/20  to-yellow-600/5  border-yellow-500/20  text-yellow-400",
    red:     "from-red-600/20     to-red-600/5     border-red-500/20     text-red-400",
  };
  const cls = accentMap[accent] ?? accentMap.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${cls} p-6`}
    >
      {/* Background glow */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-2xl bg-current" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">{label}</p>
          <p className="text-4xl font-bold text-white tabular-nums">{value}</p>
        </div>
        <span className="text-3xl opacity-80">{icon}</span>
      </div>
    </motion.div>
  );
}