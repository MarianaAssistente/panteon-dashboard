"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Plus, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import KnowledgeCard, { KnowledgeItem } from "@/components/KnowledgeCard";
import KnowledgeModal from "@/components/KnowledgeModal";

const CATEGORIES = ["credencial", "decisão", "projeto", "processo", "configuração", "contato", "fato"];
const IMPORTANCES = ["crítico", "alto", "normal", "baixo"];

export default function KnowledgeBaseTab() {
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
      req = supabase.from("knowledge").select("*")
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

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => {
    supabase.from("projects").select("code").then(({ data }) => {
      if (data) setProjectCodes(data.map((p: { code: string }) => p.code).filter(Boolean));
    });
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-[#F5F5F5]/25 text-xs">{items.length} registro{items.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-sm font-semibold hover:bg-[#D4AF37]/20 transition-colors"
        >
          <Plus size={14} /> Novo
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F5F5F5]/30" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título, conteúdo ou código…"
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#F5F5F5] placeholder-[#F5F5F5]/25 focus:outline-none focus:border-[#D4AF37]/40"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5]/60 focus:outline-none capitalize">
          <option value="">Todas as categorias</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterImportance} onChange={(e) => setFilterImportance(e.target.value)}
          className="bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5]/60 focus:outline-none capitalize">
          <option value="">Toda importância</option>
          {IMPORTANCES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        {projectCodes.length > 0 && (
          <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
            className="bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5]/60 focus:outline-none">
            <option value="">Todos os projetos</option>
            {projectCodes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {(filterCategory || filterImportance || filterProject || query) && (
          <button onClick={() => { setFilterCategory(""); setFilterImportance(""); setFilterProject(""); setQuery(""); }}
            className="text-xs text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors px-2">
            Limpar ×
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-white/3 rounded-xl animate-pulse border border-white/5" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen size={32} className="mx-auto mb-3 text-[#D4AF37]/20" />
          <p className="text-[#F5F5F5]/30 text-sm">Nenhum conhecimento encontrado.</p>
          <button onClick={() => setModalOpen(true)} className="mt-3 text-[#D4AF37]/60 hover:text-[#D4AF37] text-sm transition-colors">
            + Adicionar o primeiro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => <KnowledgeCard key={item.id} item={item} />)}
        </div>
      )}

      <KnowledgeModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={(item) => setItems((p) => [item, ...p])} />
    </div>
  );
}
