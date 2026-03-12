"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FolderOpen, BookOpen, Network, Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  lucideIcon?: React.ReactNode;
  badge?: number;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);

  useEffect(() => {
    // Fetch pending approval count
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", "pending")
      .then(({ count }) => setPendingCount(count ?? 0));

    // Fetch active projects count
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .then(({ count }) => setActiveProjectsCount(count ?? 0));

    // Realtime subscription
    const channel = supabase
      .channel("sidebar-counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("approval_status", "pending")
          .then(({ count }) => setPendingCount(count ?? 0));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => {
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("status", "active")
          .then(({ count }) => setActiveProjectsCount(count ?? 0));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const navItems: NavItem[] = [
    { href: "/",           label: "Dashboard",       icon: "⬡" },
    { href: "/tasks",      label: "Fila de Tarefas", icon: "◈" },
    { href: "/projects",   label: "Projetos",        icon: "□", lucideIcon: <FolderOpen size={14} />, badge: activeProjectsCount || undefined },
    { href: "/knowledge",  label: "Conhecimento",    icon: "🧠", lucideIcon: <BookOpen size={14} /> },
    { href: "/approvals",  label: "Aprovações",      icon: "◇", badge: pendingCount },
    { href: "/organograma", label: "Organograma",     icon: "◉", lucideIcon: <Network size={14} /> },
    { href: "/sites",       label: "Sites & Páginas", icon: "◌", lucideIcon: <Globe size={14} /> },
    { href: "/history",    label: "Histórico",       icon: "◎" },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col bg-[#0D0D0D] border-r border-[#D4AF37]/10 z-30">
        {/* Logo */}
        <div className="p-6 border-b border-[#D4AF37]/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              ⚡
            </div>
            <div>
              <p className="text-[#D4AF37] font-semibold text-sm tracking-wider uppercase leading-tight">
                Panteão
              </p>
              <p className="text-[#F5F5F5]/30 text-xs">do Olimpo · STM Group</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                  active
                    ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20"
                    : "text-[#F5F5F5]/50 hover:text-[#F5F5F5] hover:bg-white/4 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={active ? "text-[#D4AF37]" : "text-[#F5F5F5]/30"}>
                    {item.lucideIcon ?? item.icon}
                  </span>
                  {item.label}
                </div>
                {item.badge != null && item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                    item.href === "/projects"
                      ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30"
                      : "bg-red-500 text-white"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#D4AF37]/10">
          <p className="text-[#F5F5F5]/15 text-xs text-center">STM Group © 2026</p>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0D0D0D] border-t border-[#D4AF37]/10 flex z-50">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 relative transition-colors ${
                active ? "text-[#D4AF37]" : "text-[#F5F5F5]/30"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="text-[9px]">{item.label.split(" ")[0]}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="absolute top-1.5 right-1/4 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
