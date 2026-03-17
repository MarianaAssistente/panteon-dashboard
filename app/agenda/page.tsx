"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, Instagram, BookOpen, Timer, CheckCircle, AlertCircle, Hourglass } from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// TYPES & DATA
// ═══════════════════════════════════════════════════════════════

type PostStatus = "publicado" | "agendado" | "pendente";

interface ScheduledPost {
  id: string;
  numero: number;
  titulo: string;
  conteudo: string;
  data: string;        // "DD/MM/YYYY"
  horario: string;     // "HH:MM"
  status: PostStatus;
  tipo: "post" | "carrossel" | "chat" | "ebook" | "countdown";
  plataforma: string;
}

interface ScheduledStory {
  id: string;
  data: string;
  tema: string;
  horario: string;
  status: PostStatus;
}

const POSTS: ScheduledPost[] = [
  {
    id: "p3", numero: 3,
    titulo: "Mariana — CEO",
    conteudo: "Apresentação da Mariana como CEO do Panteão Digital. Quem é a liderança por trás dos 8 agentes.",
    data: "17/03/2026", horario: "12:00",
    status: "publicado", tipo: "post", plataforma: "Instagram @panteaodigital",
  },
  {
    id: "p4", numero: 4,
    titulo: "Atena — CSO",
    conteudo: "Apresentação da Atena, Chief Strategy Officer. Como a estratégia é feita por IA no Panteão.",
    data: "18/03/2026", horario: "12:00",
    status: "agendado", tipo: "post", plataforma: "Instagram @panteaodigital",
  },
  {
    id: "p5", numero: 5,
    titulo: "Hefesto — CTO",
    conteudo: "Apresentação do Hefesto, Chief Technology Officer. Quem constrói toda a infra do Panteão.",
    data: "19/03/2026", horario: "09:00",
    status: "agendado", tipo: "post", plataforma: "Instagram @panteaodigital",
  },
  {
    id: "p6", numero: 6,
    titulo: "Carrossel — Os 8 Agentes",
    conteudo: "Carrossel apresentando todos os 8 agentes do Panteão com seus papéis e emojis.",
    data: "20/03/2026", horario: "11:00",
    status: "agendado", tipo: "carrossel", plataforma: "Instagram @panteaodigital",
  },
  {
    id: "p7", numero: 7,
    titulo: "Chat — Bastidores IA",
    conteudo: "Post mostrando uma conversa real com um agente — bastidores do Panteão em ação.",
    data: "22/03/2026", horario: "21:00",
    status: "agendado", tipo: "chat", plataforma: "Instagram @panteaodigital",
  },
  {
    id: "p8", numero: 8,
    titulo: "E-book — Lançamento em breve",
    conteudo: "Teaser do e-book 'Construindo seu Panteão Digital'. Abertura da lista de espera.",
    data: "24/03/2026", horario: "19:00",
    status: "agendado", tipo: "ebook", plataforma: "Instagram @panteaodigital",
  },
  {
    id: "p9", numero: 9,
    titulo: "Countdown — Dia D",
    conteudo: "Post de countdown para o lançamento do e-book às 25/03. Urgência máxima.",
    data: "25/03/2026", horario: "09:00",
    status: "agendado", tipo: "countdown", plataforma: "Instagram @panteaodigital",
  },
  {
    id: "p10", numero: 10,
    titulo: "Carrossel 10 Slides — Lançamento",
    conteudo: "Carrossel de 10 slides anunciando o lançamento oficial do e-book Panteão Digital.",
    data: "25/03/2026", horario: "12:00",
    status: "agendado", tipo: "carrossel", plataforma: "Instagram @panteaodigital",
  },
];

const STORIES: ScheduledStory[] = [
  { id: "s1", data: "17/03/2026", tema: "Bastidores: gravação do post da Mariana", horario: "14:00", status: "publicado" },
  { id: "s2", data: "18/03/2026", tema: "Enquete: você usa IA no trabalho?", horario: "13:00", status: "agendado" },
  { id: "s3", data: "19/03/2026", tema: "Quiz: descubra qual agente é você", horario: "10:00", status: "agendado" },
  { id: "s4", data: "20/03/2026", tema: "Contagem regressiva — 5 dias para o lançamento", horario: "12:00", status: "agendado" },
  { id: "s5", data: "21/03/2026", tema: "Bastidores: preparação do e-book", horario: "19:00", status: "pendente" },
  { id: "s6", data: "22/03/2026", tema: "Teaser de página do e-book", horario: "21:30", status: "pendente" },
  { id: "s7", data: "24/03/2026", tema: "Countdown 24h — amanhã é o dia", horario: "20:00", status: "pendente" },
  { id: "s8", data: "25/03/2026", tema: "🚀 AO VIVO — lançamento do e-book", horario: "09:00", status: "pendente" },
];

const TIPO_ICON: Record<string, string> = {
  post: "📸", carrossel: "🎠", chat: "💬", ebook: "📚", countdown: "⏱️",
};

const TIPO_COLOR: Record<string, string> = {
  post: "#D4AF37", carrossel: "#06B6D4", chat: "#9B7EC8", ebook: "#F59E0B", countdown: "#F87171",
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function parseDate(dataStr: string, horario: string): Date {
  const [d, m, y] = dataStr.split("/").map(Number);
  const [h, min] = horario.split(":").map(Number);
  return new Date(y, m - 1, d, h, min);
}

function StatusBadge({ status }: { status: PostStatus }) {
  const cfg = {
    publicado: { icon: <CheckCircle size={11} />, label: "Publicado", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
    agendado:  { icon: <Clock size={11} />,        label: "Agendado",  cls: "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/25" },
    pendente:  { icon: <Hourglass size={11} />,    label: "Pendente",  cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function SectionHeader({ icon, title, count, color = "#D4AF37" }: {
  icon: React.ReactNode; title: string; count: number; color?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span style={{ color }}>{icon}</span>
      <h2 className="text-base font-bold text-[#F5F5F5]">{title}</h2>
      <span className="text-[10px] px-2 py-0.5 rounded-full border font-mono"
        style={{ color, borderColor: `${color}30`, backgroundColor: `${color}10` }}>
        {count}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COUNTDOWN COMPONENT
// ═══════════════════════════════════════════════════════════════

function Countdown() {
  const TARGET = new Date(2026, 2, 25, 9, 0, 0); // 25/03/2026 09:00
  const [diff, setDiff] = useState(TARGET.getTime() - Date.now());

  useEffect(() => {
    const t = setInterval(() => setDiff(TARGET.getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const past = diff <= 0;
  const days    = past ? 0 : Math.floor(diff / 86400000);
  const hours   = past ? 0 : Math.floor((diff % 86400000) / 3600000);
  const minutes = past ? 0 : Math.floor((diff % 3600000) / 60000);
  const seconds = past ? 0 : Math.floor((diff % 60000) / 1000);

  const Unit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-[#111] border border-[#D4AF37]/20 rounded-xl px-4 py-3 min-w-[64px] text-center">
        <span className="text-2xl font-bold font-mono text-[#D4AF37]">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[10px] text-[#F5F5F5]/30 mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <div className="bg-[#0D0D0D] border border-[#D4AF37]/20 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Timer size={16} className="text-[#D4AF37]" />
        <h2 className="text-base font-bold text-[#F5F5F5]">Próximo Lançamento</h2>
        <span className="text-xs text-[#F5F5F5]/40 ml-auto">25/03/2026 às 09:00</span>
      </div>

      <p className="text-sm text-[#F5F5F5]/50 mb-5">
        🚀 <strong className="text-[#D4AF37]">E-book Panteão Digital</strong> — Lançamento oficial com carrossel + stories
      </p>

      {past ? (
        <div className="text-center py-4">
          <p className="text-2xl font-bold text-[#4ADE80]">🎉 LANÇADO!</p>
          <p className="text-[#F5F5F5]/40 text-sm mt-1">O e-book foi publicado.</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 justify-center">
          <Unit value={days}    label="dias" />
          <span className="text-[#D4AF37]/40 text-2xl font-bold mb-5">:</span>
          <Unit value={hours}   label="horas" />
          <span className="text-[#D4AF37]/40 text-2xl font-bold mb-5">:</span>
          <Unit value={minutes} label="min" />
          <span className="text-[#D4AF37]/40 text-2xl font-bold mb-5">:</span>
          <Unit value={seconds} label="seg" />
        </div>
      )}

      <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F5D06F] transition-all"
          style={{
            width: past ? "100%" : `${Math.min(100, ((14 * 86400000 - diff) / (14 * 86400000)) * 100)}%`
          }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REUNIÃO SEMANAL
// ═══════════════════════════════════════════════════════════════

function ReuniaoCard() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=dom
  const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + daysUntilSunday);

  return (
    <div className="bg-[#0D0D0D] border border-[#9B7EC8]/25 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={15} className="text-[#9B7EC8]" />
        <h2 className="text-sm font-bold text-[#F5F5F5]">Reunião Semanal</h2>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#9B7EC8]/10 border border-[#9B7EC8]/25 text-[#9B7EC8]">
          Recorrente
        </span>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <p className="text-[10px] text-[#F5F5F5]/30 uppercase tracking-wider mb-0.5">Frequência</p>
          <p className="text-sm text-[#F5F5F5]/80">Todo domingo</p>
        </div>
        <div>
          <p className="text-[10px] text-[#F5F5F5]/30 uppercase tracking-wider mb-0.5">Horário</p>
          <p className="text-sm text-[#D4AF37]">A definir pelo Yuri</p>
        </div>
        <div>
          <p className="text-[10px] text-[#F5F5F5]/30 uppercase tracking-wider mb-0.5">Próxima</p>
          <p className="text-sm text-[#F5F5F5]/70">
            {nextSunday.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#F5F5F5]/30 uppercase tracking-wider mb-0.5">Pauta</p>
          <p className="text-sm text-[#F5F5F5]/50">Retrospectiva semanal dos agentes</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function AgendaPage() {
  const published  = POSTS.filter(p => p.status === "publicado").length;
  const scheduled  = POSTS.filter(p => p.status === "agendado").length;

  return (
    <div className="flex-1 min-h-screen p-6 max-w-5xl mx-auto">
      {/* ── Page Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Calendar size={18} className="text-[#D4AF37]" />
          <h1 className="text-xl font-bold text-[#F5F5F5]">Agenda do Panteão</h1>
        </div>
        <p className="text-[#F5F5F5]/40 text-sm">
          {published} publicados · {scheduled} agendados · lançamento em 25/03
        </p>
      </div>

      {/* ── Top cards row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Countdown />
        <ReuniaoCard />
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Publicados",  value: published,  color: "#4ADE80", icon: <CheckCircle size={14}/> },
          { label: "Agendados",   value: scheduled,  color: "#D4AF37", icon: <Clock size={14}/> },
          { label: "Pendentes",   value: POSTS.filter(p=>p.status==="pendente").length, color: "#71717A", icon: <Hourglass size={14}/> },
        ].map(s => (
          <div key={s.label} className="bg-[#0D0D0D] border border-[#D4AF37]/8 rounded-xl p-4 flex items-center gap-3">
            <span style={{color:s.color}}>{s.icon}</span>
            <div>
              <p className="text-xl font-bold" style={{color:s.color}}>{s.value}</p>
              <p className="text-[10px] text-[#F5F5F5]/30">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* POSTS AGENDADOS                                      */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="mb-10">
        <SectionHeader icon={<Instagram size={16}/>} title="Posts Agendados" count={POSTS.length} />

        <div className="bg-[#0D0D0D] border border-[#D4AF37]/10 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[48px_1fr_2fr_120px_80px_110px] gap-4 px-5 py-3 bg-[#111] border-b border-[#D4AF37]/10 text-[10px] text-[#F5F5F5]/30 uppercase tracking-wider font-semibold">
            <span>#</span>
            <span>Post</span>
            <span>Conteúdo</span>
            <span>Data</span>
            <span>Horário</span>
            <span>Status</span>
          </div>

          {POSTS.map((post, i) => {
            const isPast = parseDate(post.data, post.horario) < new Date();
            const color = TIPO_COLOR[post.tipo];
            return (
              <div key={post.id}
                className={`grid grid-cols-[48px_1fr_2fr_120px_80px_110px] gap-4 px-5 py-4 border-b border-[#D4AF37]/5 last:border-0 items-center transition-colors hover:bg-white/[0.02] ${
                  post.status === "publicado" ? "opacity-60" : ""
                }`}>
                {/* # */}
                <div className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold font-mono"
                  style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}30` }}>
                  {TIPO_ICON[post.tipo]}
                </div>

                {/* Título */}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#F5F5F5] truncate">{post.titulo}</p>
                  <p className="text-[10px] text-[#F5F5F5]/30 capitalize mt-0.5">{post.tipo} · {post.plataforma}</p>
                </div>

                {/* Conteúdo */}
                <p className="text-xs text-[#F5F5F5]/50 leading-relaxed line-clamp-2">{post.conteudo}</p>

                {/* Data */}
                <div className="flex items-center gap-1.5">
                  <Calendar size={11} className="text-[#F5F5F5]/25 flex-shrink-0"/>
                  <span className={`text-xs ${isPast && post.status !== "publicado" ? "text-[#F87171]" : "text-[#F5F5F5]/60"}`}>
                    {post.data}
                  </span>
                </div>

                {/* Horário */}
                <div className="flex items-center gap-1">
                  <Clock size={11} className="text-[#F5F5F5]/25 flex-shrink-0"/>
                  <span className="text-xs text-[#F5F5F5]/60">{post.horario}</span>
                </div>

                {/* Status */}
                <StatusBadge status={post.status}/>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* STORIES AGENDADOS                                    */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="mb-10">
        <SectionHeader
          icon={<BookOpen size={16}/>}
          title="Stories Agendados"
          count={STORIES.length}
          color="#06B6D4"
        />

        <div className="bg-[#0D0D0D] border border-[#06B6D4]/10 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[120px_1fr_80px_110px] gap-4 px-5 py-3 bg-[#111] border-b border-[#06B6D4]/10 text-[10px] text-[#F5F5F5]/30 uppercase tracking-wider font-semibold">
            <span>Data</span>
            <span>Tema</span>
            <span>Horário</span>
            <span>Status</span>
          </div>

          {STORIES.map(story => {
            const isPast = parseDate(story.data, story.horario) < new Date();
            return (
              <div key={story.id}
                className={`grid grid-cols-[120px_1fr_80px_110px] gap-4 px-5 py-4 border-b border-[#06B6D4]/5 last:border-0 items-center transition-colors hover:bg-white/[0.02] ${
                  story.status === "publicado" ? "opacity-60" : ""
                }`}>
                <div className="flex items-center gap-1.5">
                  <Calendar size={11} className="text-[#F5F5F5]/25"/>
                  <span className={`text-xs ${isPast && story.status !== "publicado" ? "text-[#F87171]" : "text-[#F5F5F5]/60"}`}>
                    {story.data}
                  </span>
                </div>
                <p className="text-sm text-[#F5F5F5]/80 truncate">{story.tema}</p>
                <div className="flex items-center gap-1">
                  <Clock size={11} className="text-[#F5F5F5]/25"/>
                  <span className="text-xs text-[#F5F5F5]/60">{story.horario}</span>
                </div>
                <StatusBadge status={story.status}/>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Footer note ── */}
      <div className="border border-dashed border-[#D4AF37]/10 rounded-xl p-4 text-center">
        <p className="text-[#F5F5F5]/25 text-xs">
          Agenda atualizada manualmente · Para integrar com Google Calendar, acionar Hera.
        </p>
      </div>
    </div>
  );
}
