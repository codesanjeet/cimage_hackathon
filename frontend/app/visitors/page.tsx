"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiSearchLine,
  RiFilterLine,
  RiCheckLine,
  RiCloseLine,
  RiLogoutBoxRLine,
  RiUserAddLine,
  RiRefreshLine,
} from "react-icons/ri";
import {
  getVisitors,
  approveVisitor,
  rejectVisitor,
  checkoutVisitor,
  Visitor,
  VisitorStatus,
} from "@/lib/api";
import { VisitorStatusBadge } from "@/components/StatusBadge";
import DashboardShell from "@/components/DashboardShell";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/components/Toast";
import Link from "next/link";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "",         label: "All Status"  },
  { value: "pending",  label: "Pending"     },
  { value: "approved", label: "Approved"    },
  { value: "inside",   label: "Inside"      },
  { value: "rejected", label: "Rejected"    },
  { value: "exited",   label: "Exited"      },
];

export default function VisitorsPage() {
  const { showToast } = useToast();
  const [visitors, setVisitors]   = useState<Visitor[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [status, setStatus]       = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input (400 ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

const fetchVisitors = useCallback(async () => {
  setLoading(true);
  try {
    const raw = await getVisitors(status || undefined, debouncedSearch || undefined) as any;
    const data: Visitor[] = Array.isArray(raw)          ? raw
                          : Array.isArray(raw.visitors)  ? raw.visitors
                          : Array.isArray(raw.data)      ? raw.data
                          : Array.isArray(raw.results)   ? raw.results
                          : Array.isArray(raw.items)     ? raw.items
                          : [];
    setVisitors(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load visitors";
    showToast(msg, "error");
  } finally {
    setLoading(false);
  }
}, [status, debouncedSearch]);

  useEffect(() => { fetchVisitors(); }, [fetchVisitors]);

  const doAction = async (
    id: number,
    action: "approve" | "reject" | "checkout"
  ) => {
    setActionLoading(id);
    try {
      const fn = action === "approve" ? approveVisitor
               : action === "reject"  ? rejectVisitor
               : checkoutVisitor;
      const res = await fn(id);
      showToast(res.message || `${action} successful`, "success");
      fetchVisitors();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action failed";
      showToast(msg, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (t: string | null) =>
    t ? new Date(t).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <DashboardShell
      title="Visitor Management"
      subtitle={`${visitors.length} record${visitors.length !== 1 ? "s" : ""} found`}
      actions={
        <Link href="/visitors/register" className="vms-btn-primary text-xs">
          <RiUserAddLine /> New Visitor
        </Link>
      }
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
            className="vms-input pl-10"
          />
        </div>
        <div className="relative">
          <RiFilterLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="vms-input pl-10 pr-10 appearance-none cursor-pointer min-w-[160px]"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#1a1d27]">
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button onClick={fetchVisitors} className="vms-btn-ghost text-xs gap-1.5">
          <RiRefreshLine className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Table card */}
      <div className="vms-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner size="lg" />
          </div>
        ) : visitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <RiUserAddLine className="text-4xl mb-2 opacity-30" />
            <p className="text-sm">No visitors found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="vms-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Purpose</th>
                  <th>Host ID</th>
                  <th>Status</th>
                  <th>Check-in</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {visitors.map((v, i) => (
                    <motion.tr
                      key={v.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                    >
                      <td>
                        <div>
                          <p className="font-medium text-white text-sm">{v.name}</p>
                          <p className="text-xs text-gray-500">{v.email}</p>
                        </div>
                      </td>
                      <td className="font-mono text-xs text-gray-400">{v.phone}</td>
                      <td className="max-w-[140px] truncate text-gray-400">{v.purpose}</td>
                      <td className="text-gray-400">#{v.host_id}</td>
                      <td><VisitorStatusBadge status={v.status as VisitorStatus} /></td>
                      <td className="text-xs text-gray-500">{formatTime(v.checkin_time)}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {/* Approve — show if pending */}
                          {v.status === "pending" && (
                            <button
                              onClick={() => doAction(v.id, "approve")}
                              disabled={actionLoading === v.id}
                              className="vms-btn-success py-1.5 px-2.5 text-xs"
                              title="Approve"
                            >
                              {actionLoading === v.id ? <LoadingSpinner size="sm" /> : <RiCheckLine />}
                            </button>
                          )}
                          {/* Reject — show if pending or approved */}
                          {(v.status === "pending" || v.status === "approved") && (
                            <button
                              onClick={() => doAction(v.id, "reject")}
                              disabled={actionLoading === v.id}
                              className="vms-btn-danger py-1.5 px-2.5 text-xs"
                              title="Reject"
                            >
                              {actionLoading === v.id ? <LoadingSpinner size="sm" /> : <RiCloseLine />}
                            </button>
                          )}
                          {/* Check-in link — show if approved */}
                          {v.status === "approved" && (
                            <Link
                              href={`/visitors/${v.id}/checkin`}
                              className="vms-btn vms-btn-ghost py-1.5 px-2.5 text-xs text-indigo-400 border-indigo-500/30 hover:bg-indigo-600/10"
                              title="OTP Check-in"
                            >
                              Check-in
                            </Link>
                          )}
                          {/* Checkout — show if inside */}
                          {v.status === "inside" && (
                            <button
                              onClick={() => doAction(v.id, "checkout")}
                              disabled={actionLoading === v.id}
                              className="vms-btn vms-btn-ghost py-1.5 px-2.5 text-xs text-orange-400 border-orange-500/30 hover:bg-orange-600/10"
                              title="Check out"
                            >
                              {actionLoading === v.id ? <LoadingSpinner size="sm" /> : <><RiLogoutBoxRLine /> Exit</>}
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}