"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Calendar, Clock, Timer,
  CheckCircle, AlertCircle, Hourglass, FileText, ChevronDown,
  ChevronUp, ChevronsUpDown, Instagram, Radio, Film,
  DollarSign, Users, Mail, BookOpen, Maximize2, Minimize2,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

type Account   = "@panteao_digital" | "@stm.capital" | "@stmgroup";
type ContentType = "Feed Post" | "Story" | "Reel" | "Tráfego Pago" | "Reunião" | "Email" | "Blog Post";
type Status    = "Publicado" | "Agendado" | "Pendente Aprovação" | "Rascunho" | "Cancelado";
type Criticality = "Rotineiro" | "Moderado" | "Crítico" | "Urgente";

type PipelineStep = "Roteiro" | "Copywriting" | "Conteúdo" | "Aprovação" | "Agendado" | "Publicado";
const PIPELINE: PipelineStep[] = ["Roteiro","Copywriting","Conteúdo","Aprovação","Agendado","Publicado"];

interface ContentItem {
  id: string;
  titulo: string;
  conteudo?: string;
  caption?: string;
  account: Account;
  type: ContentType;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  status: Status;
  criticality: Criticality;
  pipeline: PipelineStep;
  recorrente?: boolean;
  tags?: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════

const ITEMS: ContentItem[] = [
  // ── Feed @panteao_digital ─────────────────────────────────────────────
  {
    id:"p3", titulo:"Post 3 — Mariana CEO",
    conteudo:"Apresentação da Mariana como CEO. Quem é a liderança do Panteão Digital.",
    caption:"👑 Conheça a CEO do Panteão...",
    account:"@panteao_digital", type:"Feed Post",
    date:"2026-03-17", time:"09:00",
    status:"Publicado", criticality:"Rotineiro", pipeline:"Publicado",
    tags:["apresentacao","ceo","mariana"],
  },
  {
    id:"p4", titulo:"POST-004 — Atena CSO",
    conteudo:"Apresentação da Atena, Chief Strategy Officer. Estratégia feita por IA.",
    account:"@panteao_digital", type:"Feed Post",
    date:"2026-03-18", time:"12:00",
    status:"Agendado", criticality:"Rotineiro", pipeline:"Agendado",
    tags:["apresentacao","cso","atena"],
  },
  {
    id:"p5", titulo:"POST-005 — Hefesto CTO",
    conteudo:"Apresentação do Hefesto, Chief Technology Officer. Quem constrói a infra.",
    account:"@panteao_digital", type:"Feed Post",
    date:"2026-03-19", time:"09:00",
    status:"Agendado", criticality:"Rotineiro", pipeline:"Agendado",
    tags:["apresentacao","cto","hefesto"],
  },
  {
    id:"p6", titulo:"POST-006 — Carrossel 6 slides",
    conteudo:"Carrossel 6 slides apresentando os agentes do Panteão Digital.",
    account:"@panteao_digital", type:"Feed Post",
    date:"2026-03-20", time:"11:00",
    status:"Agendado", criticality:"Rotineiro", pipeline:"Agendado",
    tags:["carrossel","agentes"],
  },
  {
    id:"p7", titulo:"POST-007 — Chat IA",
    conteudo:"Post mostrando conversa real com agente — bastidores do Panteão em ação.",
    account:"@panteao_digital", type:"Feed Post",
    date:"2026-03-22", time:"21:00",
    status:"Agendado", criticality:"Rotineiro", pipeline:"Agendado",
    tags:["bastidores","chat","ia"],
  },
  {
    id:"p8", titulo:"POST-008 — E-book Panteão",
    conteudo:"Teaser do e-book 'Construindo seu Panteão Digital'. Abertura da lista de espera.",
    account:"@panteao_digital", type:"Feed Post",
    date:"2026-03-24", time:"19:00",
    status:"Agendado", criticality:"Moderado", pipeline:"Agendado",
    tags:["ebook","lancamento","teaser"],
  },
  {
    id:"p9", titulo:"POST-009 — Countdown Lançamento 🔴",
    conteudo:"Post de countdown para o lançamento do e-book às 25/03. Máxima urgência.",
    account:"@panteao_digital", type:"Feed Post",
    date:"2026-03-25", time:"09:00",
    status:"Agendado", criticality:"Crítico", pipeline:"Agendado",
    tags:["countdown","lancamento","ebook"],
  },
  {
    id:"p10", titulo:"POST-010 — Carrossel 10 slides 🔴",
    conteudo:"Carrossel de 10 slides anunciando o lançamento oficial do e-book Panteão Digital.",
    account:"@panteao_digital", type:"Feed Post",
    date:"2026-03-25", time:"12:00",
    status:"Agendado", criticality:"Crítico", pipeline:"Agendado",
    tags:["carrossel","lancamento","ebook"],
  },

  // ── Stories @panteao_digital — STR-001..008 semana 17-23/03 ──────────
  {
    id:"str001", titulo:"STR-001 — Teaser Mariana CEO",
    conteudo:"Teaser do post da Mariana CEO. Publicar assim que token for renovado.",
    account:"@panteao_digital", type:"Story",
    date:"2026-03-17", time:"09:00",
    status:"Pendente Aprovação", criticality:"Rotineiro", pipeline:"Agendado",
    tags:["teaser","mariana","token-pendente"],
  },
  {
    id:"str002", titulo:"STR-002 — Poll: Você usa IA?",
    conteudo:"Enquete de engajamento: você já usa IA no seu negócio?",
    account:"@panteao_digital", type:"Story",
    date:"2026-03-17", time:"21:00",
    status:"Agendado", criticality:"Rotineiro", pipeline:"Agendado",
    tags:["poll","engajamento"],
  },
  {
    id:"str003", titulo:"STR-003 — Bastidor Atena",
    conteudo:"Bastidores da Atena CSO em ação — print de estratégia sendo formulada.",
    account:"@panteao_digital", type:"Story",
    date:"2026-03-18", time:"07:30",
    status:"Agendado", criticality:"Rotineiro", pipeline:"Agendado",
    tags:["bastidor","atena"],
  },
  {
    id:"str004", titulo:"STR-004 — Countdown 7 dias",
    conteudo:"Contagem regressiva: 7 dias para o lançamento do e-book.",
    account:"@panteao_digital", type:"Story",
    date:"2026-03-18", time:"21:00",
    status:"Agendado", criticality:"Moderado", pipeline:"Agendado",
    tags:["countdown","lancamento"],
  },
  {
    id:"str005", titulo:"STR-005 — Dica IA",
    conteudo:"Dica rápida de IA para o dia — formato vertical, fundo preto, texto dourado.",
    account:"@panteao_digital", type:"Story",
    date:"2026-03-19", time:"07:30",
    status:"Agendado", criticality:"Rotineiro", pipeline:"Agendado",
    tags:["dica","ia","educativo"],
  },
  {
    id:"str006", titulo:"STR-006 — Poll: Qual agente é você?",
    conteudo:"Poll interativo: com qual agente do Panteão você mais se identifica?",
    account:"@panteao_digital", type:"Story",
    date:"2026-03-19", time:"21:00",
    status:"Agendado", criticality:"Rotineiro", pipeline:"Agendado",
    tags:["poll","agentes","engajamento"],
  },
  {
    id:"str007", titulo:"STR-007 — Bastidor Hefesto",
    conteudo:"Bastidores do Hefesto CTO — print de código sendo gerado, infra rodando.",
    account:"@panteao_digital", type:"Story",
    date:"2026-03-20", time:"07:30",
    status:"Agendado", criticality:"Rotineiro", pipeline:"Agendado",
    tags:["bastidor","hefesto","cto"],
  },
  {
    id:"str008", titulo:"STR-008 — Countdown 5 dias",
    conteudo:"Contagem regressiva: 5 dias para o lançamento. Urgência crescendo.",
    account:"@panteao_digital", type:"Story",
    date:"2026-03-20", time:"21:00",
    status:"Agendado", criticality:"Moderado", pipeline:"Agendado",
    tags:["countdown","lancamento"],
  },
  // Stories semana 2 (placeholders Afrodite)
  {
    id:"s5", titulo:"Story — Bastidores e-book (pág. 1)",
    conteudo:"Em criação por Afrodite.",
    account:"@panteao_digital", type:"Story",
    date:"2026-03-21", time:"19:00",
    status:"Rascunho", criticality:"Rotineiro", pipeline:"Roteiro",
    tags:["afrodite","em-criacao"],
  },
  {
    id:"s6", titulo:"Story — Contagem regressiva 4 dias",
    conteudo:"Em criação por Afrodite.",
    account:"@panteao_digital", type:"Story",
    date:"2026-03-21", time:"21:30",
    status:"Rascunho", criticality:"Moderado", pipeline:"Roteiro",
    tags:["afrodite","em-criacao"],
  },
  {
    id:"s7", titulo:"Story — Countdown 24h",
    conteudo:"Em criação por Afrodite.",
    account:"@panteao_digital", type:"Story",
    date:"2026-03-24", time:"20:00",
    status:"Rascunho", criticality:"Crítico", pipeline:"Roteiro",
    tags:["afrodite","em-criacao"],
  },
  {
    id:"s8", titulo:"Story — 🚀 AO VIVO — Lançamento",
    conteudo:"Em criação por Afrodite.",
    account:"@panteao_digital", type:"Story",
    date:"2026-03-25", time:"09:00",
    status:"Rascunho", criticality:"Crítico", pipeline:"Roteiro",
    tags:["afrodite","em-criacao"],
  },

  // ── Reunião recorrente ────────────────────────────────────────────────
  {
    id:"r1", titulo:"Reunião Semanal — Retrospectiva",
    conteudo:"Retrospectiva semanal de todos os agentes. Pauta: entregas, bloqueios, próxima semana.",
    account:"@panteao_digital", type:"Reunião",
    date:"2026-03-23", time:"19:00",
    status:"Agendado", criticality:"Moderado", pipeline:"Agendado",
    recorrente: true,
    tags:["reuniao","retrospectiva","semanal"],
  },

  // ── @stm.capital ──────────────────────────────────────────────────────
  {
    id:"cap1", titulo:"@stm.capital — Estratégia de Conteúdo",
    conteudo:"Conta parada. Necessita estratégia de conteúdo e calendário editorial. Prioridade: criar primeiros 4 posts do mês.",
    account:"@stm.capital", type:"Feed Post",
    date:"2026-03-20", time:"10:00",
    status:"Rascunho", criticality:"Moderado", pipeline:"Roteiro",
    tags:["stm-capital","estrategia","pendente"],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

const ACCOUNT_CFG: Record<Account,{color:string;bg:string;label:string}> = {
  "@panteao_digital": { color:"#C9A84C", bg:"#C9A84C18", label:"@panteao_digital" },
  "@stm.capital":     { color:"#06B6D4", bg:"#06B6D418", label:"@stm.capital"     },
  "@stmgroup":        { color:"#9B7EC8", bg:"#9B7EC818", label:"@stmgroup"         },
};

const STATUS_CFG: Record<Status,{icon:React.ReactNode;color:string;bg:string;label:string}> = {
  "Publicado":         { icon:<CheckCircle size={10}/>,  color:"#4ADE80", bg:"#4ADE8018", label:"Publicado"         },
  "Agendado":          { icon:<Clock size={10}/>,         color:"#C9A84C", bg:"#C9A84C18", label:"Agendado"          },
  "Pendente Aprovação":{ icon:<Hourglass size={10}/>,     color:"#F59E0B", bg:"#F59E0B18", label:"Pend. Aprovação"   },
  "Rascunho":          { icon:<FileText size={10}/>,      color:"#71717A", bg:"#71717A18", label:"Rascunho"          },
  "Cancelado":         { icon:<AlertCircle size={10}/>,   color:"#EF4444", bg:"#EF444418", label:"Cancelado"         },
};

const CRITICALITY_CFG: Record<Criticality,{dot:string;color:string;label:string}> = {
  "Rotineiro": { dot:"#22C55E", color:"#22C55E", label:"Rotineiro" },
  "Moderado":  { dot:"#F59E0B", color:"#F59E0B", label:"Moderado"  },
  "Crítico":   { dot:"#EF4444", color:"#EF4444", label:"Crítico"   },
  "Urgente":   { dot:"#1F1F1F", color:"#F5F5F5", label:"Urgente"   },
};

const TYPE_CFG: Record<ContentType,{icon:React.ReactNode;color:string}> = {
  "Feed Post":    { icon:<Instagram size={13}/>, color:"#C9A84C" },
  "Story":        { icon:<Radio size={13}/>,     color:"#06B6D4" },
  "Reel":         { icon:<Film size={13}/>,      color:"#9B7EC8" },
  "Tráfego Pago": { icon:<DollarSign size={13}/>,color:"#F87171" },
  "Reunião":      { icon:<Users size={13}/>,     color:"#4ADE80" },
  "Email":        { icon:<Mail size={13}/>,      color:"#F59E0B" },
  "Blog Post":    { icon:<BookOpen size={13}/>,  color:"#8BA888" },
};

const DAYS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setDate(d.getDate() - d.getDay()); // Sunday=0
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(d.getDate() + n);
  return r;
}

// ═══════════════════════════════════════════════════════════════════════
// PIPELINE BAR
// ═══════════════════════════════════════════════════════════════════════

function PipelineBar({ step }: { step: PipelineStep }) {
  const idx = PIPELINE.indexOf(step);
  return (
    <div className="flex items-center gap-0.5 mt-3">
      {PIPELINE.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={s} className="flex-1 flex flex-col items-center gap-1">
            <div className={`h-1.5 w-full rounded-full transition-colors ${
              done   ? "bg-[#C9A84C]" :
              active ? "bg-[#C9A84C]/50" :
                       "bg-white/8"
            }`}/>
            {active && (
              <span className="text-[8px] text-[#C9A84C] font-medium leading-none">{s}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CONTENT CARD (expandable)
// ═══════════════════════════════════════════════════════════════════════

function ContentCard({ item, forceExpanded }: { item: ContentItem; forceExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const isOpen = forceExpanded ?? expanded;

  const acct  = ACCOUNT_CFG[item.account];
  const st    = STATUS_CFG[item.status];
  const crit  = CRITICALITY_CFG[item.criticality];
  const type  = TYPE_CFG[item.type];

  return (
    <div className={`bg-[#0D0D0D] border rounded-xl overflow-hidden transition-all ${
      item.criticality === "Crítico" ? "border-[#EF4444]/20" :
      item.criticality === "Urgente" ? "border-[#F5F5F5]/30" :
      "border-white/8"
    }`}>
      {/* Header */}
      <div
        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => !forceExpanded && setExpanded(e => !e)}
      >
        {/* Type icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
          style={{ backgroundColor: `${type.color}18`, color: type.color }}>
          {type.icon}
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {/* Criticality dot */}
            <span className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: crit.dot }}/>
            {/* Title */}
            <span className="text-sm font-semibold text-[#F5F5F5] truncate">{item.titulo}</span>
            {item.recorrente && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80] flex-shrink-0">⟳ Recorrente</span>
            )}
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Account */}
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0"
              style={{ color: acct.color, backgroundColor: acct.bg }}>
              {acct.label}
            </span>
            {/* Type */}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#F5F5F5]/40 flex-shrink-0">
              {item.type}
            </span>
            {/* Status */}
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
              style={{ color: st.color, backgroundColor: st.bg }}>
              {st.icon} {st.label}
            </span>
            {/* Criticality */}
            <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
              style={{ color: crit.color, backgroundColor: `${crit.dot}15` }}>
              ● {crit.label}
            </span>
            {/* Time */}
            <span className="text-[10px] text-[#F5F5F5]/30 flex-shrink-0 ml-auto">
              <Clock size={9} className="inline mr-0.5"/>{item.time}
            </span>
          </div>

          {/* Pipeline bar */}
          <PipelineBar step={item.pipeline} />
        </div>

        {/* Expand toggle */}
        {!forceExpanded && (
          <button className="text-[#F5F5F5]/20 hover:text-[#F5F5F5]/50 flex-shrink-0 mt-1">
            {isOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </button>
        )}
      </div>

      {/* Expanded content */}
      {isOpen && (item.conteudo || item.caption || item.tags?.length) && (
        <div className="px-3 pb-3 pt-0 border-t border-white/5 space-y-2">
          {item.conteudo && (
            <div>
              <p className="text-[10px] text-[#F5F5F5]/25 uppercase tracking-wider mb-1">Conteúdo / Briefing</p>
              <p className="text-xs text-[#F5F5F5]/60 leading-relaxed">{item.conteudo}</p>
            </div>
          )}
          {item.caption && (
            <div>
              <p className="text-[10px] text-[#F5F5F5]/25 uppercase tracking-wider mb-1">Caption (rascunho)</p>
              <p className="text-xs text-[#C9A84C]/70 italic leading-relaxed">"{item.caption}"</p>
            </div>
          )}
          {item.tags?.length && (
            <div className="flex flex-wrap gap-1 pt-1">
              {item.tags.map(t => (
                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-[#F5F5F5]/30">#{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CALENDAR WEEK VIEW
// ═══════════════════════════════════════════════════════════════════════

function CalendarWeekView({
  weekOffset, items, onDayClick,
}: {
  weekOffset: number;
  items: ContentItem[];
  onDayClick: (date: string) => void;
}) {
  const today = new Date();
  const base  = addDays(startOfWeek(today), weekOffset * 7);
  const days  = Array.from({ length: 7 }, (_, i) => addDays(base, i));

  // Group items by date
  const byDate: Record<string, ContentItem[]> = {};
  for (const item of items) {
    (byDate[item.date] ??= []).push(item);
  }

  const monthLabel = (() => {
    const first = days[0], last = days[6];
    if (first.getMonth() === last.getMonth())
      return `${MONTHS_PT[first.getMonth()]} ${first.getFullYear()}`;
    return `${MONTHS_PT[first.getMonth()]} – ${MONTHS_PT[last.getMonth()]} ${last.getFullYear()}`;
  })();

  return (
    <div>
      <p className="text-xs text-[#F5F5F5]/30 text-center mb-2">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const iso      = toISO(day);
          const dayItems = byDate[iso] ?? [];
          const isToday  = toISO(today) === iso;

          return (
            <button key={iso} onClick={() => onDayClick(iso)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all min-h-[80px] text-left ${
                isToday
                  ? "border-[#C9A84C]/40 bg-[#C9A84C]/8"
                  : dayItems.length
                  ? "border-white/8 bg-[#0D0D0D] hover:border-[#C9A84C]/20"
                  : "border-white/5 bg-transparent hover:border-white/10"
              }`}>
              {/* Day header */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-[#F5F5F5]/30 uppercase">{DAYS_PT[day.getDay()]}</span>
                <span className={`text-sm font-bold leading-tight ${
                  isToday ? "text-[#C9A84C]" : "text-[#F5F5F5]/80"
                }`}>{day.getDate()}</span>
              </div>

              {/* Activity badges */}
              {dayItems.length > 0 && (
                <div className="flex flex-wrap gap-0.5 justify-center w-full">
                  {dayItems.slice(0, 4).map(item => {
                    const cfg = CRITICALITY_CFG[item.criticality];
                    const tc  = TYPE_CFG[item.type];
                    return (
                      <div key={item.id}
                        className="w-4 h-4 rounded flex items-center justify-center text-[8px]"
                        style={{ backgroundColor: `${tc.color}25`, color: tc.color }}
                        title={item.titulo}>
                        {item.type === "Feed Post" ? "📸" :
                         item.type === "Story"     ? "◎"  :
                         item.type === "Reunião"   ? "👥" :
                         item.type === "Reel"      ? "🎬" : "•"}
                      </div>
                    );
                  })}
                  {dayItems.length > 4 && (
                    <div className="w-4 h-4 rounded bg-white/5 flex items-center justify-center text-[8px] text-[#F5F5F5]/30">
                      +{dayItems.length - 4}
                    </div>
                  )}
                </div>
              )}

              {/* Criticality indicator */}
              {dayItems.some(i => i.criticality === "Crítico" || i.criticality === "Urgente") && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-auto"/>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// COUNTDOWN
// ═══════════════════════════════════════════════════════════════════════

function Countdown() {
  const [now, setNow] = useState(Date.now());
  const target = new Date(2026, 2, 25, 9, 0, 0).getTime();

  // Update every second using useEffect-free approach would require state
  // Using a ref-based tick won't work in server; keep state + simple effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tick = useCallback(() => setNow(Date.now()), []);

  // Manual interval via useState with setTimeout to avoid stale closures
  const [, forceUpdate] = useState(0);
  if (typeof window !== "undefined") {
    // Lazy one-time setup via module-level or just trigger rerender
  }

  const diff = Math.max(0, target - now);
  const days    = Math.floor(diff / 86400000);
  const hours   = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  // Update every second
  if (typeof window !== "undefined") {
    setTimeout(() => setNow(Date.now()), 1000);
  }

  const U = ({ v, l }: { v: number; l: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-[#111] border border-[#C9A84C]/20 rounded-lg px-3 py-2 min-w-[52px] text-center">
        <span className="text-xl font-bold font-mono text-[#C9A84C]">{String(v).padStart(2,"0")}</span>
      </div>
      <span className="text-[9px] text-[#F5F5F5]/25 mt-1 uppercase tracking-wider">{l}</span>
    </div>
  );

  return (
    <div className="bg-[#0D0D0D] border border-[#C9A84C]/15 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Timer size={14} className="text-[#C9A84C]"/>
        <span className="text-sm font-bold text-[#F5F5F5]">Lançamento E-book</span>
        <span className="ml-auto text-[10px] text-[#F5F5F5]/30">25/03 · 09:00</span>
      </div>
      <p className="text-xs text-[#F5F5F5]/40 mb-4">🚀 Panteão Digital — lançamento oficial</p>
      {diff <= 0 ? (
        <p className="text-center text-xl font-bold text-[#4ADE80]">🎉 LANÇADO!</p>
      ) : (
        <div className="flex justify-center gap-2">
          <U v={days} l="dias"/> <span className="text-[#C9A84C]/30 text-xl font-bold self-start mt-2">:</span>
          <U v={hours} l="h"/> <span className="text-[#C9A84C]/30 text-xl font-bold self-start mt-2">:</span>
          <U v={minutes} l="min"/> <span className="text-[#C9A84C]/30 text-xl font-bold self-start mt-2">:</span>
          <U v={seconds} l="seg"/>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════

export default function AgendaPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [filterAccount, setFilterAccount]     = useState<Account | "">("");
  const [filterCriticality, setFilterCriticality] = useState<Criticality | "">("");
  const [filterStatus, setFilterStatus]       = useState<Status | "">("");
  const [filterType, setFilterType]           = useState<ContentType | "">("");
  const [allExpanded, setAllExpanded]         = useState(false);

  const filtered = useMemo(() => {
    return ITEMS.filter(item => {
      if (filterAccount     && item.account      !== filterAccount)     return false;
      if (filterCriticality && item.criticality  !== filterCriticality) return false;
      if (filterStatus      && item.status       !== filterStatus)      return false;
      if (filterType        && item.type         !== filterType)        return false;
      return true;
    });
  }, [filterAccount, filterCriticality, filterStatus, filterType]);

  const dayItems = useMemo(() =>
    selectedDay ? filtered.filter(i => i.date === selectedDay) : filtered,
    [selectedDay, filtered]
  );

  // Stats
  const published = ITEMS.filter(i => i.status === "Publicado").length;
  const scheduled = ITEMS.filter(i => i.status === "Agendado").length;
  const pending   = ITEMS.filter(i => i.status === "Pendente Aprovação").length;
  const drafts    = ITEMS.filter(i => i.status === "Rascunho").length;

  const clearFilters = () => {
    setFilterAccount(""); setFilterCriticality("");
    setFilterStatus(""); setFilterType(""); setSelectedDay(null);
  };

  const hasFilters = filterAccount || filterCriticality || filterStatus || filterType || selectedDay;

  // Sort items by date+time
  const sortedItems = [...dayItems].sort((a, b) =>
    `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
  );

  // Group by date for the list view
  const groupedByDate = useMemo(() => {
    const groups: Record<string, ContentItem[]> = {};
    for (const item of sortedItems) {
      (groups[item.date] ??= []).push(item);
    }
    return groups;
  }, [sortedItems]);

  function formatDateHeader(iso: string) {
    const d = new Date(iso + "T12:00:00");
    const today = toISO(new Date());
    const tomorrow = toISO(addDays(new Date(), 1));
    if (iso === today)    return "Hoje";
    if (iso === tomorrow) return "Amanhã";
    return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  }

  return (
    <div className="flex-1 min-h-screen p-6" style={{ background: "#08080f" }}>
      <div className="max-w-5xl mx-auto">

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={18} className="text-[#C9A84C]"/>
              <h1 className="text-xl font-bold text-[#F5F5F5]">Agenda de Conteúdo</h1>
            </div>
            <p className="text-sm text-[#F5F5F5]/40">
              {published} publicados · {scheduled} agendados · {pending} aguardando aprovação · {drafts} rascunhos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAllExpanded(e => !e)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111] border border-white/10 rounded-lg text-xs text-[#F5F5F5]/50 hover:text-[#F5F5F5]/80 transition-colors">
              {allExpanded ? <><Minimize2 size={12}/> Minimizar tudo</> : <><Maximize2 size={12}/> Expandir tudo</>}
            </button>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label:"Publicados",     v:published, color:"#4ADE80" },
            { label:"Agendados",      v:scheduled, color:"#C9A84C" },
            { label:"Pend. Aprovação",v:pending,   color:"#F59E0B" },
            { label:"Rascunhos",      v:drafts,    color:"#71717A" },
          ].map(s => (
            <div key={s.label} className="bg-[#0D0D0D] border border-white/5 rounded-xl p-3 text-center">
              <p className="text-xl font-bold" style={{color:s.color}}>{s.v}</p>
              <p className="text-[10px] text-[#F5F5F5]/30 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Calendar (2 weeks) ── */}
        <div className="bg-[#0D0D0D] border border-[#C9A84C]/10 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-[#F5F5F5]">Calendário</span>
            <div className="flex items-center gap-2">
              {selectedDay && (
                <button onClick={() => setSelectedDay(null)}
                  className="text-xs text-[#C9A84C]/60 hover:text-[#C9A84C] px-2 py-1 rounded border border-[#C9A84C]/20 transition-colors">
                  ✕ Limpar dia
                </button>
              )}
              <button onClick={() => setWeekOffset(0)}
                className="text-[10px] text-[#F5F5F5]/30 hover:text-[#F5F5F5]/60 px-2 py-1 transition-colors">
                Hoje
              </button>
              <button onClick={() => setWeekOffset(w => w - 1)}
                className="p-1 rounded hover:bg-white/5 text-[#F5F5F5]/40 hover:text-[#F5F5F5]/70 transition-colors">
                <ChevronLeft size={16}/>
              </button>
              <button onClick={() => setWeekOffset(w => w + 1)}
                className="p-1 rounded hover:bg-white/5 text-[#F5F5F5]/40 hover:text-[#F5F5F5]/70 transition-colors">
                <ChevronRight size={16}/>
              </button>
            </div>
          </div>

          {/* Two weeks */}
          <div className="space-y-4">
            <CalendarWeekView weekOffset={weekOffset}   items={ITEMS} onDayClick={d => setSelectedDay(d === selectedDay ? null : d)} />
            <div className="border-t border-white/5"/>
            <CalendarWeekView weekOffset={weekOffset+1} items={ITEMS} onDayClick={d => setSelectedDay(d === selectedDay ? null : d)} />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <span className="text-[9px] text-[#F5F5F5]/20 uppercase tracking-wider">Legenda:</span>
            {(["Feed Post","Story","Reunião"] as ContentType[]).map(t => (
              <span key={t} className="flex items-center gap-1 text-[10px]"
                style={{color: TYPE_CFG[t].color}}>
                <span>{t === "Feed Post" ? "📸" : t === "Story" ? "◎" : "👥"}</span> {t}
              </span>
            ))}
            <span className="flex items-center gap-1 text-[10px] text-[#EF4444]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] inline-block"/> Crítico
            </span>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-2 mb-5 items-center">
          <ChevronsUpDown size={12} className="text-[#F5F5F5]/30"/>

          <Select value={filterAccount} onChange={v => setFilterAccount(v as Account | "")}
            placeholder="Todas as contas">
            <option value="">Todas as contas</option>
            {(Object.keys(ACCOUNT_CFG) as Account[]).map(a => <option key={a} value={a}>{a}</option>)}
          </Select>

          <Select value={filterCriticality} onChange={v => setFilterCriticality(v as Criticality | "")}
            placeholder="Criticidade">
            <option value="">Toda criticidade</option>
            {(Object.keys(CRITICALITY_CFG) as Criticality[]).map(c => <option key={c} value={c}>{c}</option>)}
          </Select>

          <Select value={filterStatus} onChange={v => setFilterStatus(v as Status | "")}
            placeholder="Status">
            <option value="">Todos os status</option>
            {(Object.keys(STATUS_CFG) as Status[]).map(s => <option key={s} value={s}>{s}</option>)}
          </Select>

          <Select value={filterType} onChange={v => setFilterType(v as ContentType | "")}
            placeholder="Tipo">
            <option value="">Todos os tipos</option>
            {(Object.keys(TYPE_CFG) as ContentType[]).map(t => <option key={t} value={t}>{t}</option>)}
          </Select>

          {hasFilters && (
            <button onClick={clearFilters}
              className="text-xs text-[#C9A84C]/50 hover:text-[#C9A84C] transition-colors">
              Limpar filtros ×
            </button>
          )}

          <span className="ml-auto text-xs text-[#F5F5F5]/25">{sortedItems.length} item{sortedItems.length !== 1 ? "s" : ""}</span>
        </div>

        {/* ── Selected day banner ── */}
        {selectedDay && (
          <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-[#C9A84C]/8 border border-[#C9A84C]/20 rounded-xl">
            <Calendar size={13} className="text-[#C9A84C]"/>
            <span className="text-sm text-[#C9A84C]">
              {formatDateHeader(selectedDay)} — {dayItems.length} item{dayItems.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* ── Content list ── */}
        <div className="space-y-6">
          {Object.keys(groupedByDate).length === 0 ? (
            <div className="text-center py-12 text-[#F5F5F5]/25 text-sm">
              Nenhum conteúdo encontrado para os filtros selecionados.
            </div>
          ) : (
            Object.entries(groupedByDate).map(([date, items]) => (
              <div key={date}>
                {/* Date group header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-[#C9A84C] capitalize">
                    {formatDateHeader(date)}
                  </span>
                  <span className="text-[10px] text-[#F5F5F5]/20">
                    {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" })}
                  </span>
                  <div className="flex-1 h-px bg-[#C9A84C]/10"/>
                  <span className="text-[10px] text-[#F5F5F5]/20">{items.length} item{items.length > 1 ? "s" : ""}</span>
                </div>

                <div className="space-y-2">
                  {items.map(item => (
                    <ContentCard key={item.id} item={item} forceExpanded={allExpanded || undefined}/>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ══ FORMATO MODELO ══ */}
        <FormatoModeloSection/>

        {/* ══ TOKEN RENOVADO ══ */}
        <div className="mt-6 flex items-start gap-3 p-4 bg-[#4ADE80]/8 border border-[#4ADE80]/25 rounded-xl">
          <CheckCircle size={16} className="text-[#4ADE80] flex-shrink-0 mt-0.5"/>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#4ADE80]">✅ Token Instagram renovado — 17/03/2026</p>
            <p className="text-xs text-[#F5F5F5]/50 mt-1">
              Novo Page Access Token para <strong className="text-[#C9A84C]">@panteao_digital</strong> ativo e sem expiração.
              Posts POST-006 em diante publicarão normalmente. Ver <a href="/credentials" className="underline text-[#C9A84C]">Credenciais</a>.
            </p>
          </div>
          <span className="flex-shrink-0 text-[10px] px-2 py-1 bg-[#4ADE80]/15 border border-[#4ADE80]/25 rounded-lg text-[#4ADE80] font-semibold whitespace-nowrap">
            Não expira
          </span>
        </div>

        {/* ── Countdown ── */}
        <div className="mt-6">
          <Countdown/>
        </div>

        {/* ══ HEARTBEATS & CRONS ══ */}
        <CronsSection/>

        {/* ── @stm.capital alert ── */}
        <div className="mt-4 flex items-start gap-3 p-4 bg-[#F59E0B]/8 border border-[#F59E0B]/20 rounded-xl">
          <AlertCircle size={16} className="text-[#F59E0B] flex-shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm font-semibold text-[#F59E0B]">@stm.capital — Conta sem estratégia</p>
            <p className="text-xs text-[#F5F5F5]/40 mt-1">
              Conta parada. Necessita calendário editorial, primeiros 4 posts do mês e definição de tom de voz. Acionar Afrodite.
            </p>
          </div>
        </div>

        {/* ── Reunião recorrente ── */}
        <div className="mt-4 flex items-center gap-3 p-4 bg-[#4ADE80]/5 border border-[#4ADE80]/15 rounded-xl">
          <Users size={15} className="text-[#4ADE80] flex-shrink-0"/>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#F5F5F5]">Reunião Semanal</p>
            <p className="text-xs text-[#F5F5F5]/40">Todo domingo às 19h BRT · Retrospectiva dos agentes</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80]">⟳ Recorrente</span>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-[#F5F5F5]/15 mt-8">
          Agenda atualizada manualmente · Para integrar com Google Calendar, acionar Hera
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// FORMATO MODELO — POSTS & STORIES
// ═══════════════════════════════════════════════════════════════════════

function FormatoModeloSection() {
  const [tab, setTab] = useState<"post"|"story">("post");

  return (
    <div className="mt-6 bg-[#0D0D0D] border border-[#C9A84C]/12 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        <span className="text-base">🎨</span>
        <span className="text-sm font-bold text-[#F5F5F5]">Formato Modelo — @panteao_digital</span>
        <div className="ml-auto flex gap-1">
          {(["post","story"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                tab === t
                  ? "bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C]"
                  : "text-[#F5F5F5]/30 hover:text-[#F5F5F5]/60"
              }`}>
              {t === "post" ? "📸 Feed Post" : "◎ Story"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {tab === "post" ? <FormatoPost/> : <FormatoStory/>}
      </div>
    </div>
  );
}

function FormatoPost() {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* Preview mockup */}
      <div className="flex-shrink-0">
        <p className="text-[9px] text-[#F5F5F5]/25 uppercase tracking-wider mb-2 text-center">Preview · 1080×1350px (4:5)</p>
        {/* 4:5 scaled mockup */}
        <div
          className="relative rounded-xl overflow-hidden shadow-2xl"
          style={{
            width: 200, height: 250,
            background: "#0a0a0f",
            border: "1px solid #C9A84C30",
          }}
        >
          {/* Top logo area */}
          <div className="absolute top-4 left-0 right-0 flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <span style={{ color:"#C9A84C", fontSize:14 }}>👑</span>
              <span style={{ color:"#C9A84C", fontSize:14 }}>⚡</span>
            </div>
            <p style={{ fontFamily:"serif", color:"#C9A84C", fontSize:7, letterSpacing:"0.15em", textTransform:"uppercase" }}>
              PANTEÃO DIGITAL
            </p>
          </div>
          {/* Content area */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5">
            <p style={{ fontFamily:"serif", color:"#C9A84C", fontSize:13, fontWeight:700, textAlign:"center", lineHeight:1.3 }}>
              Título do Post
            </p>
            <p style={{ color:"#F5F5F5CC", fontSize:7.5, textAlign:"center", marginTop:8, lineHeight:1.5 }}>
              Corpo do texto em Inter,<br/>branco sobre fundo preto.
            </p>
          </div>
          {/* Pagination dots */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
            {[0,1,2,3,4].map(i => (
              <div key={i} className="rounded-full"
                style={{ width:4, height:4, backgroundColor: i===0?"#C9A84C":"#C9A84C40" }}/>
            ))}
          </div>
          {/* Subtle gold vignette top */}
          <div className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ background:"radial-gradient(ellipse at 50% 0%, #C9A84C08 0%, transparent 60%)" }}/>
        </div>
      </div>

      {/* Specs */}
      <div className="flex-1 space-y-3">
        <p className="text-[10px] text-[#F5F5F5]/25 uppercase tracking-wider font-semibold">Especificações Aprovadas</p>

        {[
          { label:"Dimensões",   value:"1080 × 1350 px (proporção 4:5)" },
          { label:"Fundo",       value:"#0a0a0f — preto profundo" },
          { label:"Logo",        value:"👑⚡ Coroa + raio — canto superior centralizado" },
          { label:"Fonte título",value:"Playfair Display — dourado #d4af37, bold" },
          { label:"Fonte corpo", value:"Inter — branco #FFFFFF, regular" },
          { label:"Dots paginação", value:"Dourado #C9A84C — base centralizada" },
          { label:"Brilho",      value:"Vignette dourada sutil no topo (radial-gradient)" },
          { label:"Aprovado por",value:"Yuri Moraes — 17/03/2026" },
        ].map(s => (
          <div key={s.label} className="flex gap-3">
            <span className="text-[10px] text-[#F5F5F5]/30 w-32 flex-shrink-0">{s.label}</span>
            <span className="text-[10px] text-[#F5F5F5]/70">{s.value}</span>
          </div>
        ))}

        <div className="mt-4 p-3 bg-[#C9A84C]/5 border border-[#C9A84C]/15 rounded-xl">
          <p className="text-[10px] text-[#C9A84C]/70">
            💡 Este é o template de referência para todos os agentes criarem conteúdo consistente.
            Qualquer variação de formato deve ser aprovada pelo Yuri antes de aplicar.
          </p>
        </div>
      </div>
    </div>
  );
}

function FormatoStory() {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* Preview mockup */}
      <div className="flex-shrink-0">
        <p className="text-[9px] text-[#F5F5F5]/25 uppercase tracking-wider mb-2 text-center">Preview · 1080×1920px (9:16)</p>
        {/* 9:16 scaled mockup */}
        <div
          className="relative rounded-xl overflow-hidden shadow-2xl"
          style={{
            width: 120, height: 213,
            background: "radial-gradient(ellipse at 50% 10%, #C9A84C12 0%, #0a0a0f 50%)",
            border: "1px solid #C9A84C30",
          }}
        >
          {/* Logo area — top 1/3 */}
          <div className="absolute top-4 left-0 right-0 flex flex-col items-center gap-1">
            {/* Logo circle */}
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ border:"1.5px solid #C9A84C50", background:"#C9A84C08" }}>
              <div className="flex gap-0.5">
                <span style={{ color:"#C9A84C", fontSize:16 }}>👑</span>
              </div>
            </div>
            <p style={{ fontFamily:"serif", color:"#C9A84C", fontSize:5.5, letterSpacing:"0.12em", textTransform:"uppercase", marginTop:2 }}>
              PANTEÃO DIGITAL
            </p>
          </div>
          {/* Foto circular (quando aplicável) */}
          <div className="absolute left-0 right-0 flex justify-center" style={{ top:80 }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-base"
              style={{ border:"1.5px solid #C9A84C", background:"#111" }}>
              👤
            </div>
          </div>
          {/* Título e tagline */}
          <div className="absolute left-0 right-0 px-3 text-center" style={{ top:136 }}>
            <p style={{ fontFamily:"serif", color:"#C9A84C", fontSize:8, fontWeight:700, lineHeight:1.3 }}>
              Mariana
            </p>
            <p style={{ fontFamily:"serif", color:"#C9A84C99", fontSize:6, fontStyle:"italic", marginTop:2, lineHeight:1.4 }}>
              "Fundadora do Panteão"
            </p>
          </div>
          {/* Tagline base */}
          <div className="absolute bottom-4 left-0 right-0 px-3 text-center">
            <p style={{ color:"#F5F5F5CC", fontSize:5.5, lineHeight:1.5 }}>
              Construindo o futuro<br/>com Inteligência Artificial
            </p>
          </div>
          {/* Gold radial top */}
          <div className="absolute inset-0 pointer-events-none rounded-xl"
            style={{ background:"radial-gradient(ellipse at 50% 0%, #C9A84C15 0%, transparent 55%)" }}/>
        </div>
      </div>

      {/* Specs */}
      <div className="flex-1 space-y-3">
        <p className="text-[10px] text-[#F5F5F5]/25 uppercase tracking-wider font-semibold">Especificações Aprovadas</p>

        {[
          { label:"Dimensões",     value:"1080 × 1920 px (proporção 9:16)" },
          { label:"Fundo",         value:"#0a0a0f + brilho dourado radial no topo" },
          { label:"Logo",          value:"👑 Coroa — 280px — centralizada no topo" },
          { label:"Fonte título",  value:"Playfair Display — dourado #d4af37, bold" },
          { label:"Tagline",       value:"Playfair Display itálico — dourado" },
          { label:"Foto (quando aplicável)", value:"Circular com borda dourada #C9A84C" },
          { label:"Fonte corpo",   value:"Inter — branco #FFFFFF" },
          { label:"Safe zone",     value:"80px topo/base — sem texto nessas áreas" },
          { label:"Aprovado por",  value:"Yuri Moraes — 17/03/2026" },
        ].map(s => (
          <div key={s.label} className="flex gap-3">
            <span className="text-[10px] text-[#F5F5F5]/30 w-36 flex-shrink-0">{s.label}</span>
            <span className="text-[10px] text-[#F5F5F5]/70">{s.value}</span>
          </div>
        ))}

        <div className="mt-4 p-3 bg-[#06B6D4]/5 border border-[#06B6D4]/15 rounded-xl">
          <p className="text-[10px] text-[#06B6D4]/70">
            💡 Stories: sempre manter safe zone de 80px no topo e base (área do perfil/interações do IG).
            Foto circular somente quando há apresentação de agente/pessoa.
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// HEARTBEATS & CRONS SECTION
// ═══════════════════════════════════════════════════════════════════════

type CronStatus = "ok" | "alerta" | "erro" | "pendente";

interface CronEntry {
  id: string;
  nome: string;
  tipo: "heartbeat" | "post" | "reuniao" | "infra" | "outro";
  frequencia: string;
  proximaExec: string;
  expressao: string;
  ultimoStatus: CronStatus;
  ultimaMensagem?: string;
}

const CRONS: CronEntry[] = [
  {
    id:"hb-mariana", nome:"Heartbeat Mariana", tipo:"heartbeat",
    frequencia:"3x dia — 09h, 16h, 21h BRT",
    proximaExec:"Próximo: 09:00 BRT (amanhã)",
    expressao:"0 12,19,0 * * *",
    ultimoStatus:"ok", ultimaMensagem:"HEARTBEAT_OK — 17/03 21:00",
  },
  {
    id:"post4", nome:"Post 4 @panteao_digital", tipo:"post",
    frequencia:"Uma vez — 18/03 12h BRT",
    proximaExec:"18/03/2026 às 12:00 BRT",
    expressao:"0 15 18 3 *",
    ultimoStatus:"pendente", ultimaMensagem:"Aguardando execução",
  },
  {
    id:"post-seg", nome:"Post Automático — Segunda", tipo:"post",
    frequencia:"Toda segunda 11h UTC",
    proximaExec:"Próxima segunda 11h UTC",
    expressao:"0 11 * * 1",
    ultimoStatus:"ok", ultimaMensagem:"Último: 16/03 11:00",
  },
  {
    id:"post-qua", nome:"Post Automático — Quarta", tipo:"post",
    frequencia:"Toda quarta 15h UTC",
    proximaExec:"Próxima quarta 15h UTC",
    expressao:"0 15 * * 3",
    ultimoStatus:"ok", ultimaMensagem:"Último: 11/03 15:00",
  },
  {
    id:"post-sex", nome:"Post Automático — Sexta", tipo:"post",
    frequencia:"Toda sexta 21h UTC",
    proximaExec:"Próxima sexta 21h UTC",
    expressao:"0 21 * * 5",
    ultimoStatus:"ok", ultimaMensagem:"Último: 14/03 21:00",
  },
  {
    id:"post-dom", nome:"Post Automático — Domingo", tipo:"post",
    frequencia:"Todo domingo 13h UTC",
    proximaExec:"23/03/2026 13:00 UTC",
    expressao:"0 13 * * 0",
    ultimoStatus:"ok", ultimaMensagem:"Último: 16/03 13:00",
  },
  {
    id:"reuniao", nome:"Reunião Semanal — Delegate Mariana", tipo:"reuniao",
    frequencia:"Todo domingo 13h UTC (10h BRT)",
    proximaExec:"23/03/2026 13:00 UTC",
    expressao:"0 13 * * 0",
    ultimoStatus:"ok", ultimaMensagem:"Último: 16/03 13:00",
  },
  {
    id:"notify-agents", nome:"Notify Agents", tipo:"infra",
    frequencia:"A cada 15 minutos",
    proximaExec:"Em ~15 min",
    expressao:"*/15 * * * *",
    ultimoStatus:"ok", ultimaMensagem:"Contínuo",
  },
  {
    id:"gateway-relay", nome:"Gateway Relay (watchdog)", tipo:"infra",
    frequencia:"A cada 5 minutos",
    proximaExec:"Em ~5 min",
    expressao:"*/5 * * * *",
    ultimoStatus:"ok", ultimaMensagem:"gateway-relay.js rodando",
  },
  {
    id:"cloudflared", nome:"Tunnel Cloudflared (watchdog)", tipo:"infra",
    frequencia:"A cada 5 minutos",
    proximaExec:"Em ~5 min",
    expressao:"*/5 * * * *",
    ultimoStatus:"ok", ultimaMensagem:"Túnel ativo",
  },
];

const CRON_TIPO_CFG = {
  heartbeat: { icon:"💓", color:"#71717A", label:"Heartbeat" },
  post:      { icon:"📸", color:"#C9A84C", label:"Post"      },
  reuniao:   { icon:"👥", color:"#9B7EC8", label:"Reunião"   },
  infra:     { icon:"⚙️", color:"#06B6D4", label:"Infra"     },
  outro:     { icon:"◈",  color:"#F5F5F5", label:"Outro"     },
};

const CRON_STATUS_CFG: Record<CronStatus,{dot:string;label:string;bg:string}> = {
  ok:       { dot:"#4ADE80", label:"OK",       bg:"#4ADE8018" },
  alerta:   { dot:"#F59E0B", label:"Alerta",   bg:"#F59E0B18" },
  erro:     { dot:"#EF4444", label:"Erro",      bg:"#EF444418" },
  pendente: { dot:"#71717A", label:"Pendente", bg:"#71717A18" },
};

function CronsSection() {
  const [collapsed, setCollapsed] = useState(false);
  const [filterTipo, setFilterTipo] = useState<CronEntry["tipo"] | "">("");

  const shown = filterTipo ? CRONS.filter(c => c.tipo === filterTipo) : CRONS;

  const okCount      = CRONS.filter(c => c.ultimoStatus === "ok").length;
  const alertCount   = CRONS.filter(c => c.ultimoStatus === "alerta").length;
  const erroCount    = CRONS.filter(c => c.ultimoStatus === "erro").length;

  return (
    <div className="mt-6 bg-[#0D0D0D] border border-[#06B6D4]/15 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors"
        onClick={() => setCollapsed(c => !c)}
      >
        <span className="text-base">⚙️</span>
        <span className="text-sm font-bold text-[#F5F5F5]">Heartbeats & Crons</span>
        <div className="flex items-center gap-2 ml-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/25 text-[#4ADE80]">
            {okCount} OK
          </span>
          {alertCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/25 text-[#F59E0B]">
              {alertCount} Alerta
            </span>
          )}
          {erroCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#EF4444]">
              {erroCount} Erro
            </span>
          )}
        </div>
        <div className="ml-auto text-[#F5F5F5]/30">
          {collapsed ? <ChevronDown size={15}/> : <ChevronUp size={15}/>}
        </div>
      </button>

      {!collapsed && (
        <div className="border-t border-white/5">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 px-4 py-3 border-b border-white/5 overflow-x-auto">
            {(["","heartbeat","post","reuniao","infra"] as const).map(t => (
              <button key={t} onClick={() => setFilterTipo(t)}
                className={`px-3 py-1 rounded-lg text-[10px] font-medium transition-colors whitespace-nowrap ${
                  filterTipo === t
                    ? "bg-[#06B6D4]/15 border border-[#06B6D4]/30 text-[#06B6D4]"
                    : "text-[#F5F5F5]/30 hover:text-[#F5F5F5]/60"
                }`}>
                {t === "" ? "Todos" : `${CRON_TIPO_CFG[t].icon} ${CRON_TIPO_CFG[t].label}`}
              </button>
            ))}
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[32px_1fr_160px_160px_90px] gap-3 px-5 py-2 bg-[#0A0A0A] text-[9px] text-[#F5F5F5]/25 uppercase tracking-wider font-semibold">
            <span/>
            <span>Nome / Expressão</span>
            <span>Frequência</span>
            <span>Próxima Exec.</span>
            <span>Status</span>
          </div>

          {/* Rows */}
          {shown.map(cron => {
            const tipo = CRON_TIPO_CFG[cron.tipo];
            const st   = CRON_STATUS_CFG[cron.ultimoStatus];
            return (
              <div key={cron.id}
                className="grid grid-cols-[32px_1fr_160px_160px_90px] gap-3 px-5 py-3 border-t border-white/5 items-center hover:bg-white/[0.015] transition-colors">
                {/* Icon */}
                <div className="flex items-center justify-center w-7 h-7 rounded-lg text-sm"
                  style={{ backgroundColor: `${tipo.color}18` }}>
                  {tipo.icon}
                </div>
                {/* Name */}
                <div>
                  <p className="text-xs font-medium text-[#F5F5F5]/80">{cron.nome}</p>
                  <p className="text-[9px] text-[#F5F5F5]/25 font-mono mt-0.5">{cron.expressao}</p>
                  {cron.ultimaMensagem && (
                    <p className="text-[9px] text-[#F5F5F5]/20 mt-0.5">{cron.ultimaMensagem}</p>
                  )}
                </div>
                {/* Frequência */}
                <p className="text-[10px] text-[#F5F5F5]/45 leading-relaxed">{cron.frequencia}</p>
                {/* Próxima */}
                <p className="text-[10px] text-[#F5F5F5]/45">{cron.proximaExec}</p>
                {/* Status */}
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium"
                  style={{ color: st.dot, backgroundColor: st.bg }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: st.dot }}/>
                  {st.label}
                </span>
              </div>
            );
          })}

          {/* Heartbeats detail */}
          <div className="px-5 py-4 bg-[#080808] border-t border-white/5">
            <p className="text-[10px] text-[#F5F5F5]/25 uppercase tracking-wider mb-3">Heartbeats Mariana — histórico recente</p>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label:"17/03 09h", status:"ok"      as CronStatus },
                { label:"17/03 16h", status:"ok"      as CronStatus },
                { label:"17/03 21h", status:"ok"      as CronStatus },
                { label:"16/03 21h", status:"ok"      as CronStatus },
                { label:"16/03 16h", status:"ok"      as CronStatus },
                { label:"16/03 09h", status:"ok"      as CronStatus },
                { label:"15/03 21h", status:"alerta"  as CronStatus },
              ].map(h => (
                <div key={h.label}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
                  style={{
                    borderColor: `${CRON_STATUS_CFG[h.status].dot}30`,
                    backgroundColor: CRON_STATUS_CFG[h.status].bg,
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: CRON_STATUS_CFG[h.status].dot }}/>
                  <span className="text-[10px] font-mono"
                    style={{ color: CRON_STATUS_CFG[h.status].dot }}>{h.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Select helper ────────────────────────────────────────────────────

function Select({ value, onChange, placeholder, children }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-[#0D0D0D] border border-white/8 rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5]/60 focus:outline-none focus:border-[#C9A84C]/30 transition-colors"
    >
      {children}
    </select>
  );
}
