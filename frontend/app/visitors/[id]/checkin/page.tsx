"use client";
// app/visitors/[id]/checkin/page.tsx
// Route: /visitors/[id]/checkin
// Dynamic route — Next.js passes params.id automatically.
// POST /visitors/{id}/checkin  body: { otp }
// Designed for guard use — large text, simple UI.

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiShieldCheckLine,
  RiKeyLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiArrowLeftLine,
  RiDoorOpenLine,
} from "react-icons/ri";
import { checkinVisitor } from "@/lib/api";
import DashboardShell from "@/components/DashboardShell";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/components/Toast";

type CheckinState = "idle" | "loading" | "success" | "error";

export default function CheckinPage() {
  // params.id comes from the [id] segment in the URL
  const params  = useParams<{ id: string }>();
  const router  = useRouter();
  const { showToast } = useToast();

  const [otp, setOtp]       = useState("");
  const [visitorId, setVisitorId] = useState(params.id ?? "");
  const [state, setState]   = useState<CheckinState>("idle");
  const [message, setMessage] = useState("");

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorId || !otp) {
      showToast("Enter both Visitor ID and OTP", "error");
      return;
    }
    setState("loading");
    try {
      const res = await checkinVisitor(Number(visitorId), otp);
      setMessage(res.message || "Visitor checked in successfully");
      setState("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Check-in failed";
      setMessage(msg);
      setState("error");
      showToast(msg, "error");
    }
  };

  const reset = () => {
    setOtp(""); setState("idle"); setMessage("");
  };

  return (
    <DashboardShell title="OTP Check-in" subtitle="Guard entry verification">
      <div className="max-w-md mx-auto pt-4">

        {/* Guard-friendly big card */}
        <AnimatePresence mode="wait">
          {state === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="vms-card p-10 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-6">
                <RiCheckboxCircleLine className="text-emerald-400 text-5xl" />
              </div>
              <h2 className="text-3xl font-bold text-emerald-400 mb-2">ACCESS GRANTED</h2>
              <p className="text-gray-300 text-lg mb-2">Visitor #{visitorId}</p>
              <p className="text-gray-500 text-sm mb-8">{message}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={reset} className="vms-btn-success text-base px-6 py-3">
                  <RiDoorOpenLine className="text-xl" /> Next Visitor
                </button>
                <button onClick={() => router.push("/visitors")} className="vms-btn-ghost text-base px-6 py-3">
                  View All
                </button>
              </div>
            </motion.div>
          ) : state === "error" ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="vms-card p-10 text-center border-red-500/20"
            >
              <div className="w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center mx-auto mb-6">
                <RiErrorWarningLine className="text-red-400 text-5xl" />
              </div>
              <h2 className="text-3xl font-bold text-red-400 mb-2">ACCESS DENIED</h2>
              <p className="text-gray-400 text-sm mb-8">{message}</p>
              <button onClick={reset} className="vms-btn-danger text-base px-8 py-3">
                Try Again
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 mb-5 transition-colors"
              >
                <RiArrowLeftLine /> Back
              </button>

              <div className="vms-card p-8">
                {/* Icon + title */}
                <div className="flex flex-col items-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-4">
                    <RiShieldCheckLine className="text-indigo-400 text-3xl" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Verify Entry</h2>
                  <p className="text-gray-500 text-sm mt-1 text-center">Enter visitor ID and OTP to grant campus access</p>
                </div>

                <form onSubmit={handleCheckin} className="space-y-6">
                  {/* Visitor ID */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Visitor ID
                    </label>
                    <input
                      type="number"
                      value={visitorId}
                      onChange={(e) => setVisitorId(e.target.value)}
                      className="vms-input text-2xl font-bold text-center tracking-widest h-16"
                      placeholder="e.g. 42"
                      min={1}
                      required
                    />
                  </div>

                  {/* OTP */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <RiKeyLine /> One-Time Password
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.toUpperCase())}
                      className="vms-input text-3xl font-mono font-bold text-center tracking-[0.5em] h-20 border-indigo-500/30"
                      placeholder="• • • • • •"
                      maxLength={8}
                      required
                      autoComplete="one-time-code"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={state === "loading"}
                    className="vms-btn-primary w-full py-5 text-lg font-bold mt-2"
                  >
                    {state === "loading" ? (
                      <><LoadingSpinner size="md" /> Verifying…</>
                    ) : (
                      <><RiShieldCheckLine className="text-2xl" /> Verify &amp; Check In</>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}