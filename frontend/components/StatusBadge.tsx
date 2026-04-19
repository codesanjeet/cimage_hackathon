"use client";
// components/StatusBadge.tsx

import { VisitorStatus, AlertType } from "@/lib/api";

const visitorColors: Record<VisitorStatus, string> = {
  pending:  "bg-yellow-500/15 text-yellow-400  border-yellow-500/30",
  approved: "bg-blue-500/15   text-blue-400    border-blue-500/30",
  inside:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/15    text-red-400     border-red-500/30",
  exited:   "bg-gray-500/15   text-gray-400    border-gray-500/30",
};

const alertColors: Record<AlertType, string> = {
  overstay:   "bg-orange-500/15  text-orange-400  border-orange-500/30",
  blacklist:  "bg-red-500/15     text-red-400     border-red-500/30",
  suspicious: "bg-purple-500/15  text-purple-400  border-purple-500/30",
};

export function VisitorStatusBadge({ status }: { status: VisitorStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${visitorColors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function AlertTypeBadge({ type }: { type: AlertType }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${alertColors[type]}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}