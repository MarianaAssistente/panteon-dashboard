"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, FolderOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ProjectCard, { Project } from "@/components/ProjectCard";
import ProjectDrawer from "@/components/ProjectDrawer";

const VERTICALS = ["Todos", "STM Capital", "STM Digital", "AgiSales", "Interno", "STM Consultancy", "STM Health"];
const STATUSES  = ["Todos", "active", "paused", "completed", "cancelled"];
const STATUS_LABELS: Record<string, string> = {
  active: "Ativo", paused: "Pausado", completed: "Concluído", cancelled: "Cancelado",
};
const AGENTS = ["Todos", "mariana", "atena", "hefesto", "apollo", "afrodite", "hera", "ares", "hestia"];
const AGENT_NAMES: Record<string, string> = {
  mariana: "Mariana", atena: "Atena", hefesto: "Hefesto",
  apollo: "Apollo", afrodite: "Afrodite", hera: "Hera",
  ares: "Ares", hestia: "Héstia",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Project | null>(null);

  const [filterVertical, setFilterVertical] = useState("Todos");
  const [filterStatus, setFilterStatus]     = useState("Todos");
  const [filterAgent, setFilterAgent]       = useState("Todos");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("projects")
        .select("*, agents(id, name, status)")
        .order("priority", { ascending: true })
        .order("name", { ascending: true });
      setProjects((data as Project[]) ?? []);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("projects-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (filterVertical !== "Todos" && p.vertical !== filterVertical) return false;
      if (filterStatus  !== "Todos" && p.status   !== filterStatus)   return false;
      if (filterAgent   !== "Todos" && p.lead_agent_id !== filterAgent) return false;
      return true;
    });
  }, [projects, filterVertical, filterStatus, filterAgent]);

  const activeCount = projects.filter((p) => p.status === "active").length;

  return (
    <div className="min-h-screen bg-[#080808] text-[#F5F5F5]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
              <FolderOpen size={17} className="text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#F5F5F5]">Projetos</h1>
              <p className="text-xs text-[#F5F5F5]/30">
                {activeCount} ativos · {projects.length} total
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] text-sm rounded-xl transition-colors font-medium">
            <Plus size={15} />
            Novo Projeto
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Vertical */}
          <select
            value={filterVertical}
            onChange={(e) => setFilterVertical(e.target.value)}
            className="bg-[#1a1a1a] border border-[#D4AF37]/20 text-[#F5F5F5]/70 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37]/40 cursor-pointer"
          >
            {VERTICALS.map((v) => (
              <option key={v} value={v} className="bg-[#111]">{v === "Todos" ? "Vertical: Todos" : v}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#1a1a1a] border border-[#D4AF37]/20 text-[#F5F5F5]/70 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37]/40 cursor-pointer"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-[#111]">
                {s === "Todos" ? "Status: Todos" : STATUS_LABELS[s] ?? s}
              </option>
            ))}
          </select>

          {/* Agent */}
          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="bg-[#1a1a1a] border border-[#D4AF37]/20 text-[#F5F5F5]/70 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37]/40 cursor-pointer"
          >
            {AGENTS.map((a) => (
              <option key={a} value={a} className="bg-[#111]">
                {a === "Todos" ? "Agente: Todos" : AGENT_NAMES[a] ?? a}
              </option>
            ))}
          </select>

          {(filterVertical !== "Todos" || filterStatus !== "Todos" || filterAgent !== "Todos") && (
            <button
              onClick={() => { setFilterVertical("Todos"); setFilterStatus("Todos"); setFilterAgent("Todos"); }}
              className="px-3 py-2 text-[10px] text-[#F5F5F5]/40 hover:text-[#F5F5F5]/70 border border-white/8 rounded-lg transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 bg-white/3 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[#F5F5F5]/20 text-sm">
            Nenhum projeto encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} onClick={() => setSelected(p)} />
            ))}
          </div>
        )}
      </div>

      {/* Drawer */}
      {selected && (
        <ProjectDrawer
          project={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
