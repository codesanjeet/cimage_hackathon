"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  RiBellLine,
  RiAlarmWarningLine,
  RiRefreshLine,
  RiCheckLine,
  RiTimeLine,
  RiEyeLine,
} from "react-icons/ri";
import { getAlerts, triggerOverstayCheck, resolveAlert, Alert } from "@/lib/api";
import { AlertTypeBadge } from "@/components/StatusBadge";
import DashboardShell from "@/components/DashboardShell";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/components/Toast";

export default function AlertsPage() {
  const { showToast } = useToast();
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [resolveLoading, setResolveLoading] = useState<number | null>(null);
  const [showResolved, setShowResolved] = useState(false);

const fetchAlerts = async () => {
  setLoading(true);
  try {

const raw = await getAlerts() as any;
const data: Alert[] = Array.isArray(raw)        ? raw
                    : Array.isArray(raw.alerts)  ? raw.alerts
                    : Array.isArray(raw.data)    ? raw.data
                    : Array.isArray(raw.results) ? raw.results
                    : [];
setAlerts(data);
  } catch (err: unknown) {
    showToast(err instanceof Error ? err.message : "Failed to load alerts", "error");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { fetchAlerts(); }, []);

  const handleTriggerOverstay = async () => {
    setTriggerLoading(true);
    try {
      const res = await triggerOverstayCheck();
      showToast(res.message || "Overstay check completed", "success");
      fetchAlerts();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Check failed", "error");
    } finally {
      setTriggerLoading(false);
    }
  };

  const handleResolve = async (id: number) => {
    setResolveLoading(id);
    try {
      const res = await resolveAlert(id);
      showToast(res.message || "Alert resolved", "success");
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, resolved: true } : a));
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Resolve failed", "error");
    } finally {
      setResolveLoading(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  const filtered = showResolved ? alerts : alerts.filter((a) => !a.resolved);
  const unresolvedCount = alerts.filter((a) => !a.resolved).length;

  return (
    <DashboardShell
      title="Security Alerts"
      subtitle={`${unresolvedCount} unresolved alert${unresolvedCount !== 1 ? "s" : ""}`}
      actions={
        <div className="flex gap-2">
          <button onClick={fetchAlerts} className="vms-btn-ghost text-xs">
            <RiRefreshLine className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleTriggerOverstay}
            disabled={triggerLoading}
            className="vms-btn vms-btn-ghost text-xs border-orange-500/30 text-orange-400 hover:bg-orange-600/10"
          >
            {triggerLoading ? <LoadingSpinner size="sm" /> : <RiTimeLine />}
            Check Overstay
          </button>
        </div>
      }
    >
      {/* Toggle resolved */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => setShowResolved(!showResolved)}
          className={`vms-btn text-xs ${showResolved ? "vms-btn-ghost border-indigo-500/30 text-indigo-400" : "vms-btn-ghost"}`}
        >
          <RiEyeLine />
          {showResolved ? "Hide Resolved" : "Show All"}
        </button>
        {unresolvedCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1">
            <RiBellLine className="animate-bounce" />
            {unresolvedCount} active
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="vms-card p-12 flex flex-col items-center text-gray-600"
        >
          <RiAlarmWarningLine className="text-5xl mb-3 opacity-30" />
          <p className="font-medium text-gray-500">No active alerts</p>
          <p className="text-sm mt-1">Campus is secure</p>
        </motion.div>
      ) : (
        <LayoutGroup>
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                  className={`vms-card p-5 flex items-start gap-4 ${alert.resolved ? "opacity-50" : ""}`}
                >
                  {/* Type indicator dot */}
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                    alert.type === "overstay"   ? "bg-orange-400" :
                    alert.type === "blacklist"  ? "bg-red-400"    :
                    "bg-purple-400"
                  } ${!alert.resolved ? "animate-pulse" : ""}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <AlertTypeBadge type={alert.type} />
                      {alert.resolved && (
                        <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 flex items-center gap-1">
                          <RiCheckLine /> Resolved
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-white text-sm mt-1">{alert.visitor_name}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{alert.message}</p>
                    <p className="text-xs text-gray-600 mt-1.5">
                      Visitor #{alert.visitor_id} · {formatDate(alert.created_at)}
                    </p>
                  </div>

                  {!alert.resolved && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      disabled={resolveLoading === alert.id}
                      className="vms-btn-success py-2 px-3 text-xs flex-shrink-0"
                    >
                      {resolveLoading === alert.id ? <LoadingSpinner size="sm" /> : <><RiCheckLine /> Resolve</>}
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      )}
    </DashboardShell>
  );
}