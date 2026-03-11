"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Plus, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import KnowledgeCard, { KnowledgeItem } from "@/components/KnowledgeCard";
import KnowledgeModal from "@/components/KnowledgeModal";

const CATEGORIES = ["credencial", "decisão", "projeto", "processo", "configuração", "contato", "fato"];
const IMPORTANCES = ["crítico", "alto", "normal", "baixo"];

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterImportance, setFilterImportance] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [projectCodes, setProjectCodes] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    let req = supabase.from("knowledge").select("*").order("updated_at", { ascending: false });

    if (query.trim()) {
      req = supabase
        .from("knowledge")
        .select("*")
        .textSearch("search_vector", query.trim(), { type: "websearch", config: "portuguese" })
        .order("updated_at", { ascending: false });
    }

    if (filterCategory) req = req.eq("category", filterCategory);
    if (filterImportance) req = req.eq("importance", filterImportance);
    if (filterProject) req = req.eq("related_project_code", filterProject);

    const { data, error } = await req;
    if (!error && data) setItems(data as KnowledgeItem[]);
    setLoading(false);
  }, [query, filterCategory, filterImportance, filterProject]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    supabase.from("projects").select("code").then(({ data }) => {
      if (data) setProjectCodes(data.map((p: { code: string }) => p.code).filter(Boolean));
    });
  }, []);

  const handleSaved = (item: KnowledgeItem) => {
    setItems((prev) => [item, ...prev]);
  };

  return (
    <div className="flex-1 p-6 md:p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <BookOpen size={20} className="text-[#D4AF37]" />
            <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Knowledge Base</h1>
          </div>
          <p className="text-[#F5F5F5]/40 text-sm">Memória permanente do Panteão</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-sm font-semibold hover:bg-[#D4AF37]/20 transition-colors"
        >
          <Plus size={15} /> Novo Conhecimento
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F5F5F5]/30" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título, conteúdo ou código…"
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-[#F5F5F5] placeholder-[#F5F5F5]/25 focus:outline-none focus:border-[#D4AF37]/40"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#F5F5F5]/60 focus:outline-none focus:border-[#D4AF37]/40 capitalize"
        >
          <option value="">Todas as categorias</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={filterImportance}
          onChange={(e) => setFilterImportance(e.target.value)}
          className="bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#F5F5F5]/60 focus:outline-none focus:border-[#D4AF37]/40 capitalize"
        >
          <option value="">Toda importância</option>
          {IMPORTANCES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>

        {projectCodes.length > 0 && (
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#F5F5F5]/60 focus:outline-none focus:border-[#D4AF37]/40"
          >
            <option value="">Todos os projetos</option>
            {projectCodes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {(filterCategory || filterImportance || filterProject || query) && (
          <button
            onClick={() => { setFilterCategory(""); setFilterImportance(""); setFilterProject(""); setQuery(""); }}
            className="text-xs text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors px-2"
          >
            Limpar filtros ×
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-white/3 rounded-xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24">
          <BookOpen size={36} className="mx-auto mb-3 text-[#D4AF37]/20" />
          <p className="text-[#F5F5F5]/30 text-sm">Nenhum conhecimento encontrado.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 text-[#D4AF37]/60 hover:text-[#D4AF37] text-sm transition-colors"
          >
            + Adicionar o primeiro
          </button>
        </div>
      ) : (
        <>
          <p className="text-[#F5F5F5]/25 text-xs mb-4">{items.length} registro{items.length !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <KnowledgeCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}

      <KnowledgeModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
    </div>
  );
}
