"use client";
// app/visitors/register/page.tsx
// Route: /visitors/register
// POST /visitors/register → shows success card with visitor_id and OTP

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiUserLine,
  RiMailLine,
  RiPhoneLine,
  RiBookOpenLine,
  RiGroupLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiArrowLeftLine,
  RiFileCopyLine,
} from "react-icons/ri";
import { registerVisitor, VisitorRegisterPayload, VisitorRegisterResponse } from "@/lib/api";
import DashboardShell from "@/components/DashboardShell";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/components/Toast";
import Link from "next/link";

interface FormState {
  name: string; email: string; phone: string;
  purpose: string; host_id: string; expected_duration: string;
}

const INIT: FormState = {
  name: "", email: "", phone: "",
  purpose: "", host_id: "", expected_duration: "60",
};

export default function RegisterVisitorPage() {
  const { showToast } = useToast();
  const [form, setForm]     = useState<FormState>(INIT);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisitorRegisterResponse | null>(null);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.purpose || !form.host_id) {
      showToast("Please fill all required fields.", "error");
      return;
    }
    setLoading(true);
    try {
      const payload: VisitorRegisterPayload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        purpose: form.purpose,
        host_id: Number(form.host_id),
        expected_duration: Number(form.expected_duration),
      };
      const res = await registerVisitor(payload);
      setResult(res);
      showToast("Visitor registered successfully!", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`, "info");
  };

  return (
    <DashboardShell title="Register Visitor" subtitle="New campus visitor entry">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {result ? (
            /* ── Success card ─────────────────────────────────────────── */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="vms-card p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
                <RiCheckboxCircleLine className="text-emerald-400 text-3xl" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Visitor Registered!</h2>
              <p className="text-gray-400 text-sm mb-8">{result.message || "Entry has been created successfully."}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Visitor ID */}
                <div className="vms-card p-4 text-left">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Visitor ID</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-white tabular-nums">#{result.visitor_id}</p>
                    <button
                      onClick={() => copyToClipboard(String(result.visitor_id), "Visitor ID")}
                      className="text-gray-500 hover:text-gray-300 p-1"
                    >
                      <RiFileCopyLine />
                    </button>
                  </div>
                </div>
                {/* OTP */}
                <div className="vms-card p-4 text-left border-indigo-500/20">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">OTP Code</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold font-mono text-indigo-300 tracking-widest">{result.otp}</p>
                    <button
                      onClick={() => copyToClipboard(result.otp, "OTP")}
                      className="text-gray-500 hover:text-gray-300 p-1"
                    >
                      <RiFileCopyLine />
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-6">Share the OTP with the visitor. Guard will use it at the entry gate.</p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { setResult(null); setForm(INIT); }}
                  className="vms-btn-ghost"
                >
                  Register Another
                </button>
                <Link href={`/visitors/${result.visitor_id}/checkin`} className="vms-btn-primary">
                  Go to Check-in
                </Link>
              </div>
            </motion.div>
          ) : (
            /* ── Registration form ───────────────────────────────────── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href="/visitors" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 mb-5 transition-colors">
                <RiArrowLeftLine /> Back to visitors
              </Link>

              <div className="vms-card p-6">
                <h3 className="font-semibold text-white mb-5">Visitor Details</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name */}
                  <Field icon={<RiUserLine />} label="Full Name *">
                    <input value={form.name} onChange={set("name")} className="vms-input" placeholder="John Doe" required />
                  </Field>
                  {/* Email */}
                  <Field icon={<RiMailLine />} label="Email Address">
                    <input type="email" value={form.email} onChange={set("email")} className="vms-input" placeholder="visitor@example.com" />
                  </Field>
                  {/* Phone */}
                  <Field icon={<RiPhoneLine />} label="Phone Number *">
                    <input value={form.phone} onChange={set("phone")} className="vms-input" placeholder="+91 98765 43210" required />
                  </Field>
                  {/* Purpose */}
                  <Field icon={<RiBookOpenLine />} label="Purpose of Visit *">
                    <textarea
                      value={form.purpose}
                      onChange={set("purpose")}
                      className="vms-input resize-none h-24"
                      placeholder="Meeting with department head, maintenance, delivery…"
                      required
                    />
                  </Field>
                  {/* Host + Duration row */}
                  <div className="grid grid-cols-2 gap-4">
                    <Field icon={<RiGroupLine />} label="Host ID *">
                      <input
                        type="number"
                        value={form.host_id}
                        onChange={set("host_id")}
                        className="vms-input"
                        placeholder="1042"
                        min={1}
                        required
                      />
                    </Field>
                    <Field icon={<RiTimeLine />} label="Duration (minutes)">
                      <input
                        type="number"
                        value={form.expected_duration}
                        onChange={set("expected_duration")}
                        className="vms-input"
                        placeholder="60"
                        min={5}
                        max={480}
                      />
                    </Field>
                  </div>

                  <button type="submit" disabled={loading} className="vms-btn-primary w-full py-3 mt-2">
                    {loading ? <><LoadingSpinner size="sm" /> Registering…</> : "Register Visitor"}
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

// Small helper wrapper for form fields
function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
        <span className="text-gray-600">{icon}</span> {label}
      </label>
      {children}
    </div>
  );
}