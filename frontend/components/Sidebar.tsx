"use client";
// components/Sidebar.tsx
// Desktop: fixed left sidebar (w-64)
// Mobile: slides in via hamburger — toggle state lifted from layout

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  RiDashboardLine,
  RiUserLine,
  RiUserAddLine,
  RiBellLine,
  RiRobotLine,
  RiShieldCheckLine,
  RiLogoutBoxLine,
  RiMenuLine,
  RiCloseLine,
  RiQrCodeLine,
} from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/dashboard",          label: "Dashboard",      icon: RiDashboardLine  },
  { href: "/visitors",           label: "Visitors",       icon: RiUserLine       },
  { href: "/visitors/register",  label: "Register",       icon: RiUserAddLine    },
  // ↓ For the dynamic checkin route: navigate programmatically or type in the ID
  // Route: /visitors/[id]/checkin — see app/visitors/[id]/checkin/page.tsx
  { href: "/alerts",             label: "Alerts",         icon: RiBellLine       },
  { href: "/ai",                 label: "AI Analysis",    icon: RiRobotLine      },
];

function NavLink({ href, label, icon: Icon, onClick }: {
  href: string; label: string; icon: React.ElementType; onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
        ${active
          ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
          : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
        }
      `}
    >
      <Icon className={`text-lg flex-shrink-0 ${active ? "text-indigo-400" : ""}`} />
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    router.push("/login");
  };

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <RiShieldCheckLine className="text-white text-lg" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">Campus VMS</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Security Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest px-4 mb-3 font-semibold">Navigation</p>
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} onClick={onClose} />
        ))}

        {/* Guard checkin quick-link hint */}
        <div className="mt-4 px-4 py-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <RiQrCodeLine className="text-indigo-400" />
            <span>Guard OTP Check-in</span>
          </div>
          <p className="text-[10px] text-gray-600 mt-1">
            Navigate to <code className="text-indigo-400">/visitors/[id]/checkin</code>
          </p>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
        >
          <RiLogoutBoxLine className="text-lg" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-full w-64 bg-[#13151f] border-r border-white/5 z-30">
        <SidebarContent />
      </aside>

      {/* ── Mobile hamburger button ───────────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-[#1a1d27] border border-white/10 flex items-center justify-center text-gray-300 shadow-lg"
      >
        <RiMenuLine className="text-xl" />
      </button>

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.aside
              key="drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 250 }}
              className="md:hidden fixed top-0 left-0 h-full w-72 bg-[#13151f] border-r border-white/5 z-50 flex flex-col"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <RiCloseLine />
              </button>
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}