"use client";

import { useState, useCallback } from "react";
import {
  Shield, Eye, EyeOff, Copy, CheckCircle, AlertCircle,
  KeyRound, Hash, RefreshCw, ChevronDown, ChevronUp,
  Lock, LogOut, Search, Tag,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface CredRecord {
  code: string;
  title: string;
  content: string;   // JSON string
  category: string;
  tags: string[];
  importance: string;
  updated_at: string;
}

// Service icon / color mapping by keyword
function inferIcon(title: string, code: string): { icon: string; color: string } {
  const t = (title + code).toLowerCase();
  if (t.includes("instagram") || t.includes("panteao") || t.includes("stm.capital")) return { icon:"📸", color:"#C9A84C" };
  if (t.includes("supabase"))    return { icon:"🗄️",  color:"#3ECF8E" };
  if (t.includes("vercel"))      return { icon:"▲",   color:"#F5F5F5" };
  if (t.includes("github"))      return { icon:"🐙",  color:"#9B7EC8" };
  if (t.includes("gemini"))      return { icon:"✨",  color:"#4285F4" };
  if (t.includes("elevenlabs"))  return { icon:"🎙️", color:"#F59E0B" };
  if (t.includes("fal"))         return { icon:"🎬",  color:"#9B7EC8" };
  if (t.includes("creatomate"))  return { icon:"🎞️", color:"#06B6D4" };
  if (t.includes("hedra"))       return { icon:"🎭",  color:"#F59E0B" };
  if (t.includes("notion"))      return { icon:"📋",  color:"#F5F5F5" };
  if (t.includes("drive"))       return { icon:"📁",  color:"#34A853" };
  return { icon:"🔑", color:"#C9A84C" };
}

const IMPORTANCE_CFG: Record<string,{color:string;bg:string}> = {
  "crítico": { color:"#EF4444", bg:"#EF444415" },
  "alto":    { color:"#F59E0B", bg:"#F59E0B15" },
  "normal":  { color:"#4ADE80", bg:"#4ADE8015" },
};

// ═══════════════════════════════════════════════════════════════════════
// PARSED CONTENT RENDERER
// ═══════════════════════════════════════════════════════════════════════

const SENSITIVE_KEYS = new Set([
  "page_access_token","api_key","service_role_key","anon_key","db_password",
  "token","secret","app_secret","meta_app_secret","password",
]);

function ContentField({ label, value }: { label: string; value: string }) {
  const isSensitive = SENSITIVE_KEYS.has(label.toLowerCase().replace(/ /g,"_"));
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied]     = useState(false);

  const display = isSensitive && !revealed
    ? value.slice(0, 22) + "..."
    : value;

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-start gap-2 py-2 border-b border-white/5 last:border-0">
      <span className="text-[10px] text-[#F5F5F5]/30 w-36 flex-shrink-0 pt-0.5 capitalize">
        {label.replace(/_/g," ")}
      </span>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <code className={`text-xs font-mono break-all flex-1 ${
          isSensitive && !revealed ? "text-[#C9A84C]/60" : "text-[#F5F5F5]/75"
        }`}>
          {display}
        </code>
        {isSensitive && (
          <button onClick={() => setRevealed(r => !r)}
            className="p-1 rounded hover:bg-white/5 text-[#F5F5F5]/25 hover:text-[#F5F5F5]/60 flex-shrink-0 transition-colors"
            title={revealed ? "Ocultar" : "Revelar"}>
            {revealed ? <EyeOff size={11}/> : <Eye size={11}/>}
          </button>
        )}
        <button onClick={copy}
          className="p-1 rounded hover:bg-white/5 flex-shrink-0 transition-colors"
          style={{ color: copied ? "#4ADE80" : "#F5F5F540" }}
          title="Copiar">
          {copied ? <CheckCircle size={11}/> : <Copy size={11}/>}
        </button>
      </div>
    </div>
  );
}

function CredCard({ rec }: { rec: CredRecord }) {
  const [expanded, setExpanded] = useState(false);
  const { icon, color } = inferIcon(rec.title, rec.code);
  const imp = IMPORTANCE_CFG[rec.importance] ?? IMPORTANCE_CFG["normal"];

  let parsed: Record<string,string> = {};
  try { parsed = JSON.parse(rec.content); } catch { parsed = { conteudo: rec.content }; }

  return (
    <div className="bg-[#0D0D0D] border border-white/8 rounded-2xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background:`${color}18`, border:`1px solid ${color}30` }}>
          {icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#F5F5F5] truncate">{rec.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] font-mono text-[#F5F5F5]/20">{rec.code}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ color:imp.color, background:imp.bg }}>
              {rec.importance}
            </span>
            {rec.tags?.slice(0,3).map(t => (
              <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-[#F5F5F5]/25">
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Field count */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-[#F5F5F5]/20">
            {Object.keys(parsed).length} campos
          </span>
          <span className="text-[#F5F5F5]/20">
            {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/5 px-5 py-4">
          {Object.entries(parsed).map(([k, v]) => (
            <ContentField key={k} label={k} value={String(v)}/>
          ))}
          {rec.updated_at && (
            <p className="text-[9px] text-[#F5F5F5]/15 mt-3 flex items-center gap-1">
              <RefreshCw size={8}/> Atualizado: {new Date(rec.updated_at).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PASSWORD GATE
// ═══════════════════════════════════════════════════════════════════════

function PasswordGate({ onAuth }: { onAuth: (creds: CredRecord[]) => void }) {
  const [pw, setPw]           = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [show, setShow]       = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro desconhecido");
      } else {
        onAuth(data.credentials);
      }
    } catch {
      setError("Falha na conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 min-h-screen flex items-center justify-center p-6"
      style={{ background: "#08080f" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background:"#C9A84C18", border:"1px solid #C9A84C30" }}>
            <Shield size={28} className="text-[#C9A84C]"/>
          </div>
          <h1 className="text-xl font-bold text-[#F5F5F5]">Área Restrita</h1>
          <p className="text-[#F5F5F5]/40 text-sm mt-1">Credenciais & Tokens — Panteão do Olimpo</p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="bg-[#0D0D0D] border border-white/8 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-[10px] text-[#F5F5F5]/40 uppercase tracking-wider mb-2 block">
              Senha de acesso
            </label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="••••••••••"
                autoFocus
                className="w-full bg-[#080808] border border-white/8 rounded-xl px-4 py-3 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#C9A84C]/40 transition-colors pr-10"
              />
              <button type="button" onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F5F5F5]/25 hover:text-[#F5F5F5]/60 transition-colors">
                {show ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[#EF4444] text-xs">
              <AlertCircle size={12}/> {error}
            </div>
          )}

          <button type="submit" disabled={loading || !pw}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
            style={{ background: "#C9A84C", color:"#08080f" }}>
            {loading ? "Verificando..." : "Acessar"}
          </button>
        </form>

        <p className="text-center text-[10px] text-[#F5F5F5]/15 mt-4">
          Acesso restrito ao Yuri e agentes autorizados
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════

export default function CredentialsPage() {
  const [creds, setCreds]   = useState<CredRecord[] | null>(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("");

  const handleAuth = useCallback((data: CredRecord[]) => setCreds(data), []);

  if (!creds) return <PasswordGate onAuth={handleAuth}/>;

  // All tags
  const allTags = Array.from(new Set(creds.flatMap(c => c.tags ?? []))).sort();

  const shown = creds.filter(c => {
    if (filterTag && !(c.tags ?? []).includes(filterTag)) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) ||
             (c.tags ?? []).some(t => t.includes(q));
    }
    return true;
  });

  // Group by importance
  const critical = shown.filter(c => c.importance === "crítico");
  const high     = shown.filter(c => c.importance === "alto");
  const rest     = shown.filter(c => c.importance !== "crítico" && c.importance !== "alto");

  function Group({ title, items, color }: { title:string; items:CredRecord[]; color:string }) {
    if (!items.length) return null;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full" style={{ background:color }}/>
          <span className="text-xs font-semibold" style={{ color }}>{title}</span>
          <span className="text-[10px] text-[#F5F5F5]/20">({items.length})</span>
          <div className="flex-1 h-px" style={{ background:`${color}20` }}/>
        </div>
        <div className="space-y-2">
          {items.map(c => <CredCard key={c.code} rec={c}/>)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen p-6" style={{ background:"#08080f" }}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={18} className="text-[#C9A84C]"/>
              <h1 className="text-xl font-bold text-[#F5F5F5]">Credenciais & Tokens</h1>
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80]">
                <Lock size={9}/> Autenticado
              </span>
            </div>
            <p className="text-sm text-[#F5F5F5]/40">
              {creds.length} credenciais · {critical.length} críticas
            </p>
          </div>
          <button onClick={() => setCreds(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#F5F5F5]/30 hover:text-[#EF4444] border border-white/8 rounded-lg transition-colors">
            <LogOut size={12}/> Sair
          </button>
        </div>

        {/* Security notice */}
        <div className="flex items-start gap-2 p-3 mb-5 bg-[#F59E0B]/8 border border-[#F59E0B]/20 rounded-xl">
          <AlertCircle size={13} className="text-[#F59E0B] flex-shrink-0 mt-0.5"/>
          <p className="text-[10px] text-[#F5F5F5]/45">
            Tokens sensíveis exibidos ofuscados por padrão. Use 👁 para revelar e 📋 para copiar.
            Nunca compartilhe screenshots com tokens visíveis.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F5F5F5]/25"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="bg-[#0D0D0D] border border-white/8 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F5F5F5]/60 focus:outline-none focus:border-[#C9A84C]/30 w-44 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <Tag size={10} className="text-[#F5F5F5]/20"/>
            {["", ...allTags.slice(0,8)].map(t => (
              <button key={t} onClick={() => setFilterTag(t)}
                className={`px-2 py-1 rounded-lg text-[9px] transition-colors ${
                  filterTag === t
                    ? "bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C]"
                    : "text-[#F5F5F5]/25 hover:text-[#F5F5F5]/50"
                }`}>
                {t === "" ? "Todas" : `#${t}`}
              </button>
            ))}
          </div>
          <span className="ml-auto text-[10px] text-[#F5F5F5]/20">{shown.length} result</span>
        </div>

        {/* Groups */}
        <Group title="Críticas"  items={critical} color="#EF4444"/>
        <Group title="Alta"      items={high}     color="#F59E0B"/>
        <Group title="Normal"    items={rest}     color="#4ADE80"/>

        {shown.length === 0 && (
          <div className="text-center py-12 text-[#F5F5F5]/20 text-sm">
            Nenhuma credencial encontrada.
          </div>
        )}

        <p className="text-center text-[9px] text-[#F5F5F5]/12 mt-8">
          Fonte: Supabase Knowledge Base · Atualizado via Hefesto · Para adicionar credencial, enviar ao grupo Tech & Build
        </p>
      </div>
    </div>
  );
}
