"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Plus, BookOpen, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import KnowledgeCard, { KnowledgeItem } from "@/components/KnowledgeCard";
import KnowledgeModal from "@/components/KnowledgeModal";

const CATEGORIES = ["credencial", "decisão", "projeto", "processo", "configuração", "contato", "fato"];
const IMPORTANCES = ["crítico", "alto", "normal", "baixo"];
const AGENTS = ["mariana", "atena", "hefesto", "afrodite", "apollo", "hera", "ares", "hestia"];

export default function KnowledgeBaseTab() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [trending, setTrending] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterImportance, setFilterImportance] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterAgent, setFilterAgent] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [projectCodes, setProjectCodes] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<KnowledgeItem | undefined>(undefined);

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
    if (filterAgent) req = req.eq("agent_id", filterAgent);
    if (dateFrom) req = req.gte("created_at", dateFrom);
    if (dateTo) req = req.lte("created_at", dateTo + "T23:59:59");
    const { data, error } = await req;
    if (!error && data) setItems(data as KnowledgeItem[]);
    setLoading(false);
  }, [query, filterCategory, filterImportance, filterProject, filterAgent, dateFrom, dateTo]);

  const fetchTrending = useCallback(async () => {
    const { data } = await supabase
      .from("knowledge")
      .select("id, code, title, importance, updated_at")
      .in("importance", ["crítico", "alto"])
      .order("updated_at", { ascending: false })
      .limit(5);
    if (data) setTrending(data as KnowledgeItem[]);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { fetchTrending(); }, [fetchTrending]);
  useEffect(() => {
    supabase.from("projects").select("code").then(({ data }) => {
      if (data) setProjectCodes(data.map((p: { code: string }) => p.code).filter(Boolean));
    });
  }, []);

  const handleEdit = (item: KnowledgeItem) => {
    setEditItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditItem(undefined);
  };

  const handleSaved = (item: KnowledgeItem) => {
    setItems((p) => [item, ...p]);
  };

  const handleUpdated = (item: KnowledgeItem) => {
    setItems((p) => p.map((i) => i.id === item.id ? item : i));
  };

  const handleExportPDF = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Knowledge Base</title>
<style>body{font-family:sans-serif;padding:32px}h1{margin-bottom:24px}.item{margin-bottom:24px;border-bottom:1px solid #ccc;padding-bottom:16px}.code{font-weight:bold;color:#333}.title{font-size:18px;margin:4px 0}.content{color:#555;white-space:pre-wrap}.meta{font-size:12px;color:#999;margin-top:8px}</style></head><body>
<h1>Knowledge Base — Panteão do Olimpo</h1>
${items.map(i => `<div class="item"><span class="code">${i.code}</span><div class="title">${i.title}</div><div class="content">${i.content}</div><div class="meta">${i.category} | ${i.importance} | ${new Date(i.created_at).toLocaleDateString('pt-BR')}</div></div>`).join('')}
</body></html>`;
    const win = window.open('', '_blank');
    win?.document.write(html);
    win?.document.close();
    win?.print();
  };

  const hasFilters = filterCategory || filterImportance || filterProject || filterAgent || dateFrom || dateTo || query;

  return (
    <div className="p-6">
      {/* Trending */}
      {trending.length > 0 && (
        <div className="mb-6">
          <p className="text-[#D4AF37] text-xs font-semibold mb-2">⚡ Em Alta</p>
          <div className="flex flex-wrap gap-2">
            {trending.map((item) => (
              <button
                key={item.id}
                onClick={() => setQuery(item.code)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-xs text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors max-w-[220px]"
              >
                <span className="font-mono font-bold shrink-0">{item.code}</span>
                <span className="truncate text-[#F5F5F5]/60">{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <p className="text-[#F5F5F5]/25 text-xs">{items.length} registro{items.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            title="Exportar PDF"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[#F5F5F5]/50 text-sm hover:border-[#D4AF37]/30 hover:text-[#D4AF37] transition-colors"
          >
            <Download size={14} />
          </button>
          <button
            onClick={() => { setEditItem(undefined); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-sm font-semibold hover:bg-[#D4AF37]/20 transition-colors"
          >
            <Plus size={14} /> Novo
          </button>
        </div>
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
        <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)}
          className="bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5]/60 focus:outline-none capitalize">
          <option value="">Todos os agentes</option>
          {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5]/60 focus:outline-none"
          title="Data de"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5]/60 focus:outline-none"
          title="Data até"
        />
        {hasFilters && (
          <button onClick={() => { setFilterCategory(""); setFilterImportance(""); setFilterProject(""); setFilterAgent(""); setDateFrom(""); setDateTo(""); setQuery(""); }}
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
          {items.map((item) => (
            <KnowledgeCard key={item.id} item={item} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <KnowledgeModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSaved={handleSaved}
        onUpdated={handleUpdated}
        editItem={editItem}
      />
    </div>
  );
}
