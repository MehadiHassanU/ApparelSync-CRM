"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Target,
  TrendingUp,
  Megaphone,
  Briefcase,
  CheckSquare,
  Contact,
  Settings,
  Shirt,
  LogOut,
  ScanLine,
  ShoppingCart,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Inventory", href: "/dashboard/inventory", icon: Briefcase },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { label: "Scanner", href: "/dashboard/scanner", icon: ScanLine },
  { label: "Reports", href: "/dashboard/reports", icon: FileText },
  { label: "Customers", href: "/dashboard/customers", icon: Contact },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("apparelsync_auth");
      localStorage.removeItem("apparelsync_user");
    }
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-[60] p-2.5 rounded-2xl bg-[#111520] border border-[#1d2434] text-slate-400 hover:text-white shadow-lg transition-all"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-[55] backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          group/sidebar fixed left-0 top-0 h-full z-[60] bg-[#111520] border-r border-[#1d2434] shadow-2xl
          transition-all duration-300 ease-in-out flex flex-col justify-between p-4 select-none
          ${mobileOpen ? "w-64 translate-x-0" : "-translate-x-full w-64"}
          md:translate-x-0 md:w-20 md:hover:w-64
        `}
      >
        <div className="flex flex-col gap-8 w-full">
          {/* Brand Header */}
          <div className="flex items-center gap-3.5 px-1 py-1 overflow-hidden">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/25">
              <Shirt className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="flex flex-col whitespace-nowrap opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300 ease-in-out">
              <span className="font-extrabold text-lg tracking-tight text-white">ApparelSync</span>
              <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">CRM Suite</span>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden ml-auto p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-2 w-full">
            {navItems.map((item) => {
              const isActive = item.href !== "#" && (
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href)
              );
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-4 px-3.5 py-3 rounded-2xl text-base font-semibold transition-all cursor-pointer overflow-hidden whitespace-nowrap ${
                    isActive
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/25"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Logout Button */}
        <div className="w-full px-1">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-3.5 py-3 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-base font-semibold transition-all w-full overflow-hidden whitespace-nowrap cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
