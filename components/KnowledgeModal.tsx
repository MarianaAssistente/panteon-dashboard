"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { KnowledgeItem } from "./KnowledgeCard";

interface KnowledgeModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (item: KnowledgeItem) => void;
}

const CATEGORIES = ["credencial", "decisão", "projeto", "processo", "configuração", "contato", "fato"];
const IMPORTANCES = ["crítico", "alto", "normal", "baixo"];

export default function KnowledgeModal({ open, onClose, onSaved }: KnowledgeModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("fato");
  const [importance, setImportance] = useState("normal");
  const [tagsInput, setTagsInput] = useState("");
  const [relatedProject, setRelatedProject] = useState("");
  const [projectCodes, setProjectCodes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      supabase.from("projects").select("code").then(({ data }) => {
        if (data) setProjectCodes(data.map((p: { code: string }) => p.code).filter(Boolean));
      });
    }
  }, [open]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Título e conteúdo são obrigatórios.");
      return;
    }
    setSaving(true);
    setError("");

    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);

    const { data, error: err } = await supabase
      .from("knowledge")
      .insert({
        title: title.trim(),
        content: content.trim(),
        category,
        importance,
        tags,
        related_project_code: relatedProject || null,
      })
      .select("*")
      .single();

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved(data as KnowledgeItem);
    // reset
    setTitle(""); setContent(""); setCategory("fato"); setImportance("normal");
    setTagsInput(""); setRelatedProject("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-[#D4AF37]/20 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col gap-5 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[#D4AF37] font-semibold text-base tracking-wide">+ Novo Conhecimento</h2>
          <button onClick={onClose} className="text-[#F5F5F5]/30 hover:text-[#F5F5F5] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[#F5F5F5]/50 text-xs mb-1 block">Título *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Token da API do Supabase"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-[#F5F5F5] placeholder-[#F5F5F5]/20 focus:outline-none focus:border-[#D4AF37]/40"
            />
          </div>

          <div>
            <label className="text-[#F5F5F5]/50 text-xs mb-1 block">Conteúdo *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva o conhecimento em detalhe..."
              rows={5}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-[#F5F5F5] placeholder-[#F5F5F5]/20 focus:outline-none focus:border-[#D4AF37]/40 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#F5F5F5]/50 text-xs mb-1 block">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]/40 capitalize"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[#F5F5F5]/50 text-xs mb-1 block">Importância</label>
              <select
                value={importance}
                onChange={(e) => setImportance(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]/40 capitalize"
              >
                {IMPORTANCES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[#F5F5F5]/50 text-xs mb-1 block">Tags (separar por vírgula)</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="supabase, api, token"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-[#F5F5F5] placeholder-[#F5F5F5]/20 focus:outline-none focus:border-[#D4AF37]/40"
            />
          </div>

          <div>
            <label className="text-[#F5F5F5]/50 text-xs mb-1 block">Projeto relacionado</label>
            <select
              value={relatedProject}
              onChange={(e) => setRelatedProject(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]/40"
            >
              <option value="">— nenhum —</option>
              {projectCodes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] font-semibold text-sm hover:bg-[#D4AF37]/20 transition-colors disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar Conhecimento"}
        </button>
      </div>
    </div>
  );
}
