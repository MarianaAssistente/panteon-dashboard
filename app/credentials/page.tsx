"use client";

import { useState } from "react";
import {
  KeyRound, Eye, EyeOff, Copy, CheckCircle, AlertCircle,
  Instagram, Shield, Clock, Hash, Link, AppWindow, RefreshCw,
  ChevronDown, ChevronUp,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════
// TYPES & DATA
// ═══════════════════════════════════════════════════════════════════════

type CredStatus = "ativo" | "expirado" | "pendente" | "nao-expira";

interface Credential {
  id: string;
  service: string;
  account: string;
  type: string;
  token: string;          // full token (shown only when revealed)
  tokenPreview: string;   // first 20 chars + "..."
  status: CredStatus;
  expiresAt?: string;
  generatedAt: string;
  metadata?: Record<string, string>;
  tags: string[];
  icon: string;
  color: string;
  notes?: string;
}

const CREDENTIALS: Credential[] = [
  {
    id: "ig-panteao",
    service: "Instagram / Meta Graph API",
    account: "@panteao_digital",
    type: "Page Access Token",
    token: "EAAN_TOKEN_REDACTED_SEE_SUPABASE_KNW030",
    tokenPreview: "EAAN_TOKEN_REDACTED_SEE_SUPABASE_KNW030...",
    status: "nao-expira",
    generatedAt: "17/03/2026",
    metadata: {
      "IG User ID":       "17841443429666137",
      "Facebook Page ID": "1046722971852379",
      "Facebook Page":    "Panteão digital",
      "App ID":           "958102276563402",
      "App Name":         "Panteão Digital",
      "Endpoint":         "POST https://graph.facebook.com/v25.0/17841443429666137/media",
    },
    tags: ["instagram", "meta", "panteao-digital", "nao-expira"],
    icon: "📸",
    color: "#C9A84C",
    notes: "Page Access Token de longa duração gerado via Meta Business Suite. Substituiu o token expirado de 17/03/2026.",
  },
  {
    id: "gemini-api",
    service: "Gemini API (Google)",
    account: "yuri.moraes@stmgroup.com.br",
    type: "API Key",
    token: "GEMINI_KEY_SEE_SUPABASE_KNW026",
    tokenPreview: "AIzaSyBAgdy71pWjPmx6...",
    status: "ativo",
    generatedAt: "2026-01-01",
    metadata: {
      "Var ambiente": "GEMINI_API_KEY",
      "Script":       "/home/ceo-mariana/.openclaw/workspace/shared/mediagen.sh",
      "Output":       "/home/ceo-mariana/shared/media/",
      "Modelo":       "gemini-2.0-flash-preview-image-generation",
    },
    tags: ["gemini", "google", "imagens", "ia"],
    icon: "✨",
    color: "#4285F4",
    notes: "Usada para geração de imagens via mediagen.sh",
  },
  {
    id: "fal-api",
    service: "fal.ai — Geração de Vídeos",
    account: "yuri.moraes@outlook.com.br",
    type: "API Key",
    token: "FAL_KEY_SEE_SUPABASE_KNW023",
    tokenPreview: "0069113f-6a6b-4867-8b...",
    status: "ativo",
    generatedAt: "2026-01-01",
    metadata: {
      "Base URL": "https://fal.run",
      "Modelos":  "Veo 3.1, Seedance 2.0, Kling, Nano Banana 2",
    },
    tags: ["fal", "video", "ia"],
    icon: "🎬",
    color: "#9B7EC8",
  },
  {
    id: "hedra-api",
    service: "Hedra — Avatar Lip Sync",
    account: "yuri.moraes@outlook.com.br",
    type: "API Key",
    token: "HEDRA_KEY_SEE_SUPABASE_KNW025",
    tokenPreview: "HEDRA_KEY_SEE_SUPABASE_KNW025...",
    status: "ativo",
    generatedAt: "2026-01-01",
    metadata: {
      "Base URL": "https://api.hedra.com",
      "Uso":      "Foto + áudio → vídeo avatar lip sync",
    },
    tags: ["hedra", "avatar", "lip-sync", "video"],
    icon: "🎭",
    color: "#F59E0B",
  },
  {
    id: "creatomate-api",
    service: "Creatomate — Edição de Vídeo",
    account: "—",
    type: "API Key",
    token: "CREATOMATE_KEY_SEE_SUPABASE_KNW024",
    tokenPreview: "fa7abf10aa324241a258...",
    status: "ativo",
    generatedAt: "2026-01-01",
    metadata: {
      "Project ID":  "fa7abf10-aa32-4241-a258-665912dfb8cf",
      "Base URL":    "https://api.creatomate.com/v1",
      "Template ID": "987b4d6e-8e4a-4ac9-a076-73866ebdc5ec",
      "Template":    "Highlighted Subtitles",
    },
    tags: ["creatomate", "video", "edicao"],
    icon: "🎞️",
    color: "#06B6D4",
  },
  {
    id: "github-token",
    service: "GitHub",
    account: "MarianaAssistente",
    type: "Personal Access Token",
    token: "GHP_TOKEN_SEE_SUPABASE",
    tokenPreview: "ghp_fzTA58OZVYzUAqNWZ...",
    status: "ativo",
    expiresAt: "06/06/2026",
    generatedAt: "2025-06-06",
    metadata: {
      "Username": "MarianaAssistente",
      "Repos":    "stmgroup-site, panteon-dashboard, stmcapital-legal",
      "Pages":    "marianaassistente.github.io",
    },
    tags: ["github", "git", "repos"],
    icon: "🐙",
    color: "#F5F5F5",
  },
];

// ═══════════════════════════════════════════════════════════════════════
// STATUS CONFIG
// ═══════════════════════════════════════════════════════════════════════

const STATUS_CFG: Record<CredStatus, { label: string; color: string; bg: string; dot: string }> = {
  "ativo":       { label: "Ativo",       color: "#4ADE80", bg: "#4ADE8018", dot: "#4ADE80" },
  "nao-expira":  { label: "Não expira",  color: "#C9A84C", bg: "#C9A84C18", dot: "#C9A84C" },
  "expirado":    { label: "Expirado",    color: "#EF4444", bg: "#EF444418", dot: "#EF4444" },
  "pendente":    { label: "Pendente",    color: "#F59E0B", bg: "#F59E0B18", dot: "#F59E0B" },
};

// ═══════════════════════════════════════════════════════════════════════
// CREDENTIAL CARD
// ═══════════════════════════════════════════════════════════════════════

function CredentialCard({ cred }: { cred: Credential }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied]     = useState(false);
  const [expanded, setExpanded] = useState(cred.id === "ig-panteao"); // open by default for new token

  const st = STATUS_CFG[cred.status];

  async function copyToken() {
    await navigator.clipboard.writeText(cred.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`bg-[#0D0D0D] rounded-2xl overflow-hidden border transition-all ${
      cred.id === "ig-panteao"
        ? "border-[#C9A84C]/30 shadow-lg shadow-[#C9A84C]/5"
        : "border-white/8"
    }`}>
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: `${cred.color}18`, border: `1px solid ${cred.color}30` }}>
          {cred.icon}
        </div>

        {/* Service + account */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[#F5F5F5]">{cred.service}</span>
            {cred.id === "ig-panteao" && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] font-semibold">
                ✨ NOVO
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] text-[#F5F5F5]/40">{cred.account}</span>
            <span className="text-[10px] text-[#F5F5F5]/20">·</span>
            <span className="text-[10px] text-[#F5F5F5]/40">{cred.type}</span>
          </div>
        </div>

        {/* Status + expiry */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold"
            style={{ color: st.color, background: st.bg }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }}/>
            {st.label}
          </span>
          {cred.expiresAt && (
            <span className="text-[10px] text-[#F5F5F5]/25 flex items-center gap-1">
              <Clock size={9}/>{cred.expiresAt}
            </span>
          )}
          <span className="text-[#F5F5F5]/20 ml-1">
            {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </span>
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-white/5 px-5 py-4 space-y-4">
          {/* Token row */}
          <div>
            <p className="text-[9px] text-[#F5F5F5]/25 uppercase tracking-wider mb-2 flex items-center gap-1">
              <KeyRound size={9}/> Token
            </p>
            <div className="flex items-center gap-2 p-3 bg-[#080808] border border-white/5 rounded-xl">
              <code className="flex-1 text-xs font-mono text-[#C9A84C]/80 truncate select-all">
                {revealed ? cred.token : cred.tokenPreview}
              </code>
              <button onClick={() => setRevealed(r => !r)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-[#F5F5F5]/30 hover:text-[#F5F5F5]/60 transition-colors flex-shrink-0"
                title={revealed ? "Ocultar" : "Revelar"}>
                {revealed ? <EyeOff size={13}/> : <Eye size={13}/>}
              </button>
              <button onClick={copyToken}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                style={{ color: copied ? "#4ADE80" : "#F5F5F580" }}
                title="Copiar token">
                {copied ? <CheckCircle size={13}/> : <Copy size={13}/>}
              </button>
            </div>
            {revealed && (
              <p className="text-[9px] text-[#EF4444]/60 mt-1 flex items-center gap-1">
                <AlertCircle size={9}/> Token visível — não compartilhe esta tela
              </p>
            )}
          </div>

          {/* Metadata grid */}
          {cred.metadata && Object.keys(cred.metadata).length > 0 && (
            <div>
              <p className="text-[9px] text-[#F5F5F5]/25 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Hash size={9}/> Metadados
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                {Object.entries(cred.metadata).map(([k, v]) => (
                  <div key={k} className="flex gap-2 items-start">
                    <span className="text-[10px] text-[#F5F5F5]/25 w-28 flex-shrink-0">{k}</span>
                    <span className="text-[10px] text-[#F5F5F5]/65 font-mono break-all">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags + generated at */}
          <div className="flex items-center gap-3 flex-wrap border-t border-white/5 pt-3">
            <div className="flex flex-wrap gap-1">
              {cred.tags.map(t => (
                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-[#F5F5F5]/30">
                  #{t}
                </span>
              ))}
            </div>
            <span className="ml-auto text-[9px] text-[#F5F5F5]/20 flex items-center gap-1">
              <RefreshCw size={8}/> Gerado em {cred.generatedAt}
            </span>
          </div>

          {/* Notes */}
          {cred.notes && (
            <div className="p-3 bg-[#C9A84C]/5 border border-[#C9A84C]/10 rounded-xl">
              <p className="text-[10px] text-[#C9A84C]/60">💡 {cred.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════

export default function CredentialsPage() {
  const [filter, setFilter] = useState<CredStatus | "">("");
  const [search, setSearch] = useState("");

  const shown = CREDENTIALS.filter(c => {
    if (filter && c.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.service.toLowerCase().includes(q) ||
        c.account.toLowerCase().includes(q) ||
        c.tags.some(t => t.includes(q))
      );
    }
    return true;
  });

  const activeCount    = CREDENTIALS.filter(c => c.status === "ativo" || c.status === "nao-expira").length;
  const expiredCount   = CREDENTIALS.filter(c => c.status === "expirado").length;
  const pendingCount   = CREDENTIALS.filter(c => c.status === "pendente").length;

  return (
    <div className="flex-1 min-h-screen p-6" style={{ background: "#08080f" }}>
      <div className="max-w-4xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={18} className="text-[#C9A84C]"/>
              <h1 className="text-xl font-bold text-[#F5F5F5]">Credenciais & Tokens</h1>
            </div>
            <p className="text-sm text-[#F5F5F5]/40">
              {activeCount} ativas · {expiredCount} expiradas · {pendingCount} pendentes
            </p>
          </div>
        </div>

        {/* ── Aviso de segurança ── */}
        <div className="flex items-start gap-3 p-4 mb-6 bg-[#EF4444]/8 border border-[#EF4444]/20 rounded-xl">
          <AlertCircle size={14} className="text-[#EF4444] flex-shrink-0 mt-0.5"/>
          <p className="text-xs text-[#F5F5F5]/50">
            <strong className="text-[#EF4444]">Atenção:</strong> Tokens são ofuscados por padrão.
            Use "Revelar" apenas quando necessário e nunca compartilhe telas com tokens visíveis.
            Tokens completos estão armazenados de forma segura no Supabase Knowledge Base (KNW-030).
          </p>
        </div>

        {/* ── Token renovado — destaque ── */}
        <div className="flex items-start gap-3 p-4 mb-6 bg-[#4ADE80]/8 border border-[#4ADE80]/25 rounded-xl">
          <CheckCircle size={14} className="text-[#4ADE80] flex-shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm font-semibold text-[#4ADE80]">✅ Token Instagram renovado — 17/03/2026</p>
            <p className="text-xs text-[#F5F5F5]/40 mt-0.5">
              Novo Page Access Token para <strong className="text-[#C9A84C]">@panteao_digital</strong> gerado com sucesso.
              Tipo: <strong className="text-[#F5F5F5]/70">não expira</strong>.
              Posts agendados (POST-006 em diante) podem ser publicados normalmente.
            </p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Ativas",   value: activeCount,  color: "#4ADE80" },
            { label: "Expiradas",value: expiredCount, color: "#EF4444" },
            { label: "Total",    value: CREDENTIALS.length, color: "#C9A84C" },
          ].map(s => (
            <div key={s.label} className="bg-[#0D0D0D] border border-white/5 rounded-xl p-3 text-center">
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-[#F5F5F5]/30 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar serviço, conta, tag..."
            className="bg-[#0D0D0D] border border-white/8 rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5]/60 focus:outline-none focus:border-[#C9A84C]/30 transition-colors w-52"
          />
          {(["","ativo","nao-expira","expirado","pendente"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                filter === s
                  ? "bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C]"
                  : "bg-[#0D0D0D] border border-white/8 text-[#F5F5F5]/40 hover:text-[#F5F5F5]/70"
              }`}>
              {s === "" ? "Todas" : STATUS_CFG[s].label}
            </button>
          ))}
          <span className="ml-auto text-xs text-[#F5F5F5]/20">{shown.length} credencial{shown.length !== 1 ? "is" : ""}</span>
        </div>

        {/* ── Cards ── */}
        <div className="space-y-3">
          {shown.map(cred => (
            <CredentialCard key={cred.id} cred={cred}/>
          ))}
          {shown.length === 0 && (
            <div className="text-center py-12 text-[#F5F5F5]/20 text-sm">
              Nenhuma credencial encontrada.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 p-4 bg-[#0D0D0D] border border-white/5 rounded-xl">
          <p className="text-[10px] text-[#F5F5F5]/20 text-center">
            Credenciais completas armazenadas no Supabase Knowledge Base · KNW-022 a KNW-030 ·
            Para adicionar nova credencial, acionar Hefesto via Telegram.
          </p>
        </div>

      </div>
    </div>
  );
}
