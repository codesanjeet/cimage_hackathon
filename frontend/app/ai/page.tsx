"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiRobotLine, RiSearchLine, RiShieldLine, RiAlarmWarningLine,
  RiShieldCheckLine, RiListCheck, RiLightbulbLine, RiArrowRightLine,
  RiTimeLine, RiUserLine, RiPhoneLine, RiSparklingLine, RiFileTextLine,
} from "react-icons/ri";
import { analyzeVisitor, AIAnalysisResult, RiskLevel } from "@/lib/api";
import DashboardShell from "@/components/DashboardShell";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/components/Toast";

const riskConfig: Record<RiskLevel, {
  label: string; color: string; bg: string;
  border: string; icon: React.ReactNode; glow: string;
}> = {
  LOW: {
    label: "LOW RISK", color: "text-emerald-400",
    bg: "bg-emerald-500/10", border: "border-emerald-500/30",
    icon: <RiShieldCheckLine />, glow: "shadow-emerald-500/20",
  },
  MEDIUM: {
    label: "MEDIUM RISK", color: "text-yellow-400",
    bg: "bg-yellow-500/10", border: "border-yellow-500/30",
    icon: <RiShieldLine />, glow: "shadow-yellow-500/20",
  },
  HIGH: {
    label: "HIGH RISK", color: "text-red-400",
    bg: "bg-red-500/10", border: "border-red-500/30",
    icon: <RiAlarmWarningLine />, glow: "shadow-red-500/20",
  },
};

export default function AIPage() {
  const { showToast } = useToast();
  const [visitorId, setVisitorId] = useState("");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<AIAnalysisResult | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorId) { showToast("Enter a visitor ID", "error"); return; }
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeVisitor(Number(visitorId));
      setResult(data);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Analysis failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const riskLevel = result?.risk_level ?? "LOW";
  const cfg = riskConfig[riskLevel];

  return (
    <DashboardShell title="AI Risk Analysis" subtitle="Gemini-powered behavioural risk scoring">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Input card */}
        <div className="vms-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <RiRobotLine className="text-purple-400 text-xl" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Visitor Risk Profiler</h3>
              <p className="text-xs text-gray-500">Powered by Gemini 2.5 Flash · Real-time threat assessment</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
              <RiSparklingLine className="text-purple-400 text-xs" />
              <span className="text-xs text-purple-400 font-medium">AI</span>
            </div>
          </div>

          <form onSubmit={handleAnalyze} className="flex gap-3">
            <div className="relative flex-1">
              <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="number"
                value={visitorId}
                onChange={(e) => setVisitorId(e.target.value)}
                placeholder="Enter Visitor ID…"
                className="vms-input pl-10"
                min={1}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="vms-btn-primary px-6 flex items-center gap-2">
              {loading ? <LoadingSpinner size="sm" /> : <><RiArrowRightLine className="text-lg" />Analyze</>}
            </button>
          </form>
        </div>

        {/* Loading */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="vms-card p-12 flex flex-col items-center gap-4 text-center"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <RiRobotLine className="absolute inset-0 m-auto text-indigo-400 text-xl" />
            </div>
            <div>
              <p className="font-semibold text-white">Gemini is analysing the visitor…</p>
              <p className="text-sm text-gray-500 mt-1">
                Checking visit history, overstay duration, alert flags and behavioural patterns
              </p>
            </div>
          </motion.div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={`vms-card overflow-hidden border ${cfg.border} shadow-xl ${cfg.glow}`}
            >
              {/* Risk header */}
              <div className={`${cfg.bg} px-6 py-5 border-b ${cfg.border} flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                  {/* Photo */}
                  {result.visitor_photo ? (
                    <img
                      src={result.visitor_photo}
                      alt={result.visitor_name}
                      className={`w-14 h-14 rounded-full object-cover border-2 ${cfg.border}`}
                    />
                  ) : (
                    <div className={`w-14 h-14 rounded-full ${cfg.bg} border-2 ${cfg.border} flex items-center justify-center`}>
                      <RiUserLine className={`text-2xl ${cfg.color}`} />
                    </div>
                  )}
                  <div>
                    <p className={`text-xl font-bold tracking-wide ${cfg.color}`}>{cfg.label}</p>
                    <p className="text-sm text-white font-medium">{result.visitor_name}</p>
                    <p className="text-xs text-gray-500">Visitor #{result.visitor_id}</p>
                  </div>
                </div>

                {/* Score ring */}
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor"
                      strokeWidth="3" className="text-white/5" />
                    <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${(result.risk_score / 100) * 100.53} 100.53`}
                      strokeLinecap="round"
                      className={cfg.color}
                    />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${cfg.color}`}>
                    {result.risk_score}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-5">

                {/* Meta info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/5 px-4 py-3 flex items-center gap-2.5">
                    <RiPhoneLine className="text-gray-400 text-sm flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm text-white font-medium">{result.phone}</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/5 px-4 py-3 flex items-center gap-2.5">
                    <RiTimeLine className="text-gray-400 text-sm flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Time Inside</p>
                      <p className="text-sm text-white font-medium">
                        {result.time_inside_minutes ?? 0} min
                        <span className="text-gray-500 text-xs ml-1">
                          / {result.expected_minutes}min expected
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/5 px-4 py-3 flex items-center gap-2.5 col-span-2">
                    <RiFileTextLine className="text-gray-400 text-sm flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Purpose of Visit</p>
                      <p className="text-sm text-white font-medium">{result.purpose}</p>
                    </div>
                  </div>
                </div>

                {/* AI Summary */}
                {result.summary && (
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                      <RiSparklingLine /> AI Summary
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed">{result.summary}</p>
                  </div>
                )}

                {/* Suspicious notes */}
                {(result.suspicious_notes ?? []).length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <RiListCheck /> Suspicious Flags
                    </h4>
                    <ul className="space-y-2">
                      {(result.suspicious_notes ?? []).map((note, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.08 }}
                          className="flex items-start gap-2.5 text-sm text-gray-300 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                          {note}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendation */}
                <div className={`rounded-xl p-4 ${cfg.bg} border ${cfg.border}`}>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                    <RiLightbulbLine /> Security Recommendation
                  </h4>
                  <p className={`text-sm leading-relaxed ${cfg.color}`}>{result.recommendation}</p>
                </div>

                {/* Powered by */}
                <p className="text-xs text-gray-600 text-right">
                  Powered by {result.powered_by ?? "AI"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}