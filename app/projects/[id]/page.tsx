"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ExternalLink, Loader2, ChevronDown, ChevronRight,
  Clock, CheckCircle, AlertCircle, ListTodo, Target, Wrench,
  Briefcase, DollarSign, Settings, FileText, Tag, Printer,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface Project {
  id: string; name: string; description?: string; vertical: string;
  status: string; phase?: string; priority: number; lead_agent_id?: string;
  notion_url?: string; trello_url?: string; drive_url?: string;
  start_date?: string; deadline?: string; progress: number;
  code?: string; tags?: string[]; created_at: string; updated_at: string;
}
interface Milestone {
  id: string; project_id: string; name: string; status: string;
  assignee_agent_id?: string;
  baseline_start?: string | null; baseline_end?: string | null;
  forecast_start?: string | null; forecast_end?: string | null;
  actual_start?: string | null;   actual_end?: string | null;
  depends_on?: string[]; order_index: number;
}
interface Task {
  id: string; code?: string; title: string; status: string;
  agent_id?: string; vertical?: string; updated_at: string;
  completed_at?: string; deliverable_url?: string;
}
interface Doc {
  id: string; title: string; category: string; file_type: string;
  drive_url?: string; drive_path?: string; notes?: string; created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const VERTICAL_COLORS: Record<string,string> = {
  "STM Capital":"#D4AF37","STM Digital":"#9B7EC8","AgiSales":"#06B6D4",
  "Interno":"#8BA888","STM Consultancy":"#4ADE80","STM Health":"#F472B6",
};
const STATUS_COLORS: Record<string,string> = {
  active:"#4ADE80",paused:"#FBBF24",completed:"#71717A",cancelled:"#F87171",
};
const STATUS_LABELS: Record<string,string> = {
  active:"Ativo",paused:"Pausado",completed:"Concluído",cancelled:"Cancelado",
};
const PRIORITY_LABEL = ["","Alta","Média","Baixa"];
const PRIORITY_COLOR = ["","#EF4444","#F59E0B","#71717A"];
const AGENT_EMOJI: Record<string,string> = {
  mariana:"👑",atena:"🦉",hefesto:"⚒️",apollo:"🎨",
  afrodite:"✨",hera:"🏛️",ares:"⚔️",hestia:"🕯️",
};
const MS_STATUS: Record<string,{color:string;label:string;bar:string}> = {
  done:        {color:"#4ADE80",label:"Concluído",   bar:"#22C55E"},
  in_progress: {color:"#D4AF37",label:"Em Andamento",bar:"#D4AF37"},
  delayed:     {color:"#F87171",label:"Atrasado",    bar:"#EF4444"},
  pending:     {color:"#71717A",label:"Pendente",    bar:"#4B5563"},
};
const DOC_CATS: Record<string,{label:string;icon:React.ReactNode;color:string}> = {
  estrategia: {label:"Estratégia", icon:<Target size={13}/>,    color:"#D4AF37"},
  tecnico:    {label:"Técnico",    icon:<Wrench size={13}/>,    color:"#06B6D4"},
  comercial:  {label:"Comercial",  icon:<Briefcase size={13}/>, color:"#4ADE80"},
  financeiro: {label:"Financeiro", icon:<DollarSign size={13}/>,color:"#F59E0B"},
  operacional:{label:"Operacional",icon:<Settings size={13}/>,  color:"#9B7EC8"},
  geral:      {label:"Geral",      icon:<FileText size={13}/>,  color:"#71717A"},
};
const FILE_ICONS: Record<string,string> = {doc:"📄",slide:"📊",sheet:"📈",pdf:"📋",link:"🔗",video:"🎥"};

type Tab = "timeline"|"gantt"|"atividades"|"documentos";

// ═══════════════════════════════════════════════════════════════
// GANTT HELPERS
// ═══════════════════════════════════════════════════════════════

function parseD(s?:string|null): Date|null {
  if (!s) return null;
  const d = new Date(s+"T00:00:00Z");
  return isNaN(d.getTime()) ? null : d;
}
function fmtBR(d:Date) {
  return d.toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"2-digit",timeZone:"UTC"});
}
function fmtShort(d:Date) {
  return d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",timeZone:"UTC"});
}
function weekNum(d:Date): number {
  const jan1 = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil(((d.getTime()-jan1.getTime())/86400000 + jan1.getUTCDay()+1)/7);
}

// ═══════════════════════════════════════════════════════════════
// GANTT COMPONENT — MS Project style
// ═══════════════════════════════════════════════════════════════

function GanttChart({milestones, isPrinting}: {milestones:Milestone[]; isPrinting:boolean}) {
  const [tip, setTip] = useState<{x:number;y:number;m:Milestone}|null>(null);

  const sorted = [...milestones].sort((a,b)=>a.order_index-b.order_index);

  if (!sorted.length) return (
    <div className="flex items-center justify-center h-32 border border-dashed border-[#D4AF37]/15 rounded-xl">
      <p className="text-[#F5F5F5]/30 text-sm">Nenhum milestone cadastrado</p>
    </div>
  );

  const allDates: Date[] = [];
  sorted.forEach(m=>{
    [m.baseline_start,m.baseline_end,m.forecast_start,m.forecast_end,m.actual_start,m.actual_end]
      .forEach(s=>{const d=parseD(s);if(d)allDates.push(d);});
  });

  const PAD = 10*86400000;
  const tMin = new Date(Math.min(...allDates.map(d=>d.getTime()))-PAD);
  const tMax = new Date(Math.max(...allDates.map(d=>d.getTime()))+PAD);
  // Round to week boundaries
  const dayOfWeek = tMin.getUTCDay();
  tMin.setUTCDate(tMin.getUTCDate() - dayOfWeek);
  const span = tMax.getTime()-tMin.getTime();

  const LW = 200;  // label column
  const DW = 140;  // date column right
  const CW = 680;  // chart area
  const TW = LW+CW+DW;
  const RH = 52;   // row height
  const BH_FORECAST = 16; // forecast bar height
  const BH_BASELINE = 6;  // baseline bar height
  const MONTH_H = 26;
  const WEEK_H  = 20;
  const HDR_H   = MONTH_H + WEEK_H;
  const TH = HDR_H + sorted.length*RH + 4;

  const xOf = (d:Date) => LW + ((d.getTime()-tMin.getTime())/span)*CW;
  const wOf = (s:Date,e:Date) => Math.max(((e.getTime()-s.getTime())/span)*CW, 5);

  // Month ranges
  const months: {x:number; w:number; lbl:string}[] = [];
  {
    const cur = new Date(Date.UTC(tMin.getUTCFullYear(),tMin.getUTCMonth(),1));
    while (cur <= tMax) {
      const x = xOf(cur);
      const nxt = new Date(Date.UTC(cur.getUTCFullYear(),cur.getUTCMonth()+1,1));
      const xNxt = xOf(nxt);
      const x1 = Math.max(x, LW);
      const x2 = Math.min(xNxt, LW+CW);
      if (x2 > x1) {
        months.push({
          x: x1,
          w: x2-x1,
          lbl: cur.toLocaleDateString("pt-BR",{month:"long",year:"numeric",timeZone:"UTC"}),
        });
      }
      cur.setUTCMonth(cur.getUTCMonth()+1);
    }
  }

  // Week ticks
  const weeks: {x:number; lbl:string}[] = [];
  {
    const cur = new Date(tMin);
    while (cur <= tMax) {
      const x = xOf(cur);
      if (x >= LW && x <= LW+CW) {
        weeks.push({x, lbl: `S${weekNum(cur)}`});
      }
      cur.setUTCDate(cur.getUTCDate()+7);
    }
  }

  // Weekend shading (Sat-Sun)
  const weekends: {x:number; w:number}[] = [];
  {
    const cur = new Date(tMin);
    while (cur <= tMax) {
      const dow = cur.getUTCDay();
      if (dow === 6) { // Saturday
        const x = xOf(cur);
        const xe = xOf(new Date(cur.getTime()+2*86400000));
        const x1 = Math.max(x, LW);
        const x2 = Math.min(xe, LW+CW);
        if (x2>x1) weekends.push({x:x1, w:x2-x1});
      }
      cur.setUTCDate(cur.getUTCDate()+1);
    }
  }

  const todayX = xOf(new Date());
  const idToIdx = Object.fromEntries(sorted.map((m,i)=>[m.id,i]));

  return (
    <div className={`w-full ${isPrinting ? '' : 'overflow-x-auto'}`} onMouseLeave={()=>setTip(null)}>
      {/* Legend */}
      {!isPrinting && (
        <div className="mb-3 flex items-center gap-5 text-[11px] text-[#F5F5F5]/50">
          <span className="flex items-center gap-1.5"><span className="w-8 h-1.5 rounded bg-[#374151]"/> Baseline</span>
          <span className="flex items-center gap-1.5"><span className="w-8 h-3 rounded" style={{background:"#D4AF37"}}/> Forecast</span>
          <span className="flex items-center gap-1.5"><span className="w-8 h-3 rounded border border-[#4ADE80]" style={{background:"#4ADE8030"}}/> Realizado</span>
          <span className="flex items-center gap-1.5">♦ Milestone</span>
        </div>
      )}

      <svg width={TW} height={TH} className="select-none font-sans">
        {/* ── Background ── */}
        <rect width={TW} height={TH} fill={isPrinting ? "#FFFFFF" : "#0A0A0A"} rx={8}/>

        {/* ── Weekend shading ── */}
        {weekends.map((w,i)=>(
          <rect key={i} x={w.x} y={HDR_H} width={w.w} height={TH-HDR_H} fill={isPrinting ? "#F3F4F6" : "#FFFFFF06"}/>
        ))}

        {/* ── Month header ── */}
        <rect x={0} y={0} width={TW} height={MONTH_H} fill={isPrinting ? "#E5E7EB" : "#1A1A1A"}/>
        <line x1={0} y1={MONTH_H} x2={TW} y2={MONTH_H} stroke={isPrinting ? "#E5E7EB" : "#D4AF3740"} strokeWidth={1}/>

        {/* Left header labels */}
        <rect x={0} y={0} width={LW} height={HDR_H} fill={isPrinting ? "#F3F4F6" : "#141414"}/>
        <text x={10} y={MONTH_H-8} fontSize={11} fontWeight="600" fill={isPrinting ? "#B8860B" : "#D4AF37CC"}>Tarefa / Milestone</text>
        <line x1={LW} y1={0} x2={LW} y2={TH} stroke={isPrinting ? "#D1D5DB" : "#D4AF3733"} strokeWidth={1}/>

        {/* Right header — Datas */}
        <rect x={LW+CW} y={0} width={DW} height={HDR_H} fill={isPrinting ? "#F3F4F6" : "#141414"}/>
        <text x={LW+CW+10} y={MONTH_H-8} fontSize={10} fill={isPrinting ? "#B8860B" : "#D4AF3780"}>Início → Fim</text>
        <line x1={LW+CW} y1={0} x2={LW+CW} y2={TH} stroke={isPrinting ? "#D1D5DB" : "#D4AF3733"} strokeWidth={1}/>

        {/* Month labels */}
        {months.map((m,i)=>(
          <g key={i}>
            <text x={m.x+6} y={MONTH_H-8} fontSize={11} fontWeight="600" fill={isPrinting ? "#1a1a1a" : "#F5F5F5CC"}
              clipPath={`url(#clipm${i})`}>{m.lbl}</text>
            <clipPath id={`clipm${i}`}>
              <rect x={m.x} y={0} width={m.w} height={MONTH_H}/>
            </clipPath>
            <line x1={m.x+m.w} y1={0} x2={m.x+m.w} y2={MONTH_H} stroke={isPrinting ? "#E5E7EB" : "#D4AF3720"} strokeWidth={1}/>
          </g>
        ))}

        {/* ── Week subheader ── */}
        <rect x={LW} y={MONTH_H} width={CW} height={WEEK_H} fill={isPrinting ? "#F3F4F6" : "#141414"}/>
        <line x1={0} y1={HDR_H} x2={TW} y2={HDR_H} stroke={isPrinting ? "#E5E7EB" : "#D4AF3730"} strokeWidth={1}/>
        {weeks.map((w,i)=>(
          <g key={i}>
            <line x1={w.x} y1={MONTH_H} x2={w.x} y2={HDR_H} stroke={isPrinting ? "#E5E7EB" : "#D4AF3718"} strokeWidth={1}/>
            <text x={w.x+3} y={HDR_H-5} fontSize={9} fill={isPrinting ? "#6B7280" : "#F5F5F540"}>{w.lbl}</text>
          </g>
        ))}

        {/* ── Vertical grid lines (weeks) ── */}
        {weeks.map((w,i)=>(
          <line key={i} x1={w.x} y1={HDR_H} x2={w.x} y2={TH} stroke={isPrinting ? "#E5E7EB" : "#1F1F1F"} strokeWidth={1}/>
        ))}

        {/* ── TODAY line ── */}
        {todayX>=LW && todayX<=LW+CW && (
          <>
            <line x1={todayX} y1={HDR_H} x2={todayX} y2={TH} stroke="#EF4444" strokeWidth={2}/>
            <rect x={todayX-16} y={HDR_H} width={32} height={14} rx={3} fill="#EF4444"/>
            <text x={todayX} y={HDR_H+10} fontSize={8} fontWeight="700" fill="white" textAnchor="middle">HOJE</text>
          </>
        )}

        {/* ── Dependency arrows ── */}
        <defs>
          <marker id="arrowGold" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={isPrinting ? "#B8860B" : "#D4AF3799"}/>
          </marker>
        </defs>
        {sorted.map(m=>{
          if (!m.depends_on?.length) return null;
          return m.depends_on.map(depId=>{
            const si = idToIdx[depId], di = idToIdx[m.id];
            if (si===undefined||di===undefined) return null;
            const sm = sorted[si];
            const x1 = xOf(parseD(sm.forecast_end??sm.baseline_end??null) ?? new Date());
            const y1 = HDR_H+si*RH+RH/2;
            const x2 = xOf(parseD(m.forecast_start??m.baseline_start??null) ?? new Date());
            const y2 = HDR_H+di*RH+RH/2;
            return (
              <path key={`${m.id}-${depId}`}
                d={`M${x1},${y1} C${x1+24},${y1} ${x2-24},${y2} ${x2},${y2}`}
                fill="none" stroke={isPrinting ? "#B8860B" : "#D4AF3799"} strokeWidth={2} markerEnd="url(#arrowGold)"/>
            );
          });
        })}

        {/* ── Rows ── */}
        {sorted.map((m,i)=>{
          const y = HDR_H+i*RH;
          const st = MS_STATUS[m.status]??MS_STATUS.pending;
          const bs = parseD(m.baseline_start), be = parseD(m.baseline_end);
          const fs = parseD(m.forecast_start), fe = parseD(m.forecast_end);
          const as_= parseD(m.actual_start),   ae = parseD(m.actual_end);
          const isDiamond = fs&&fe&&fs.getTime()===fe.getTime();
          const pct = m.status==='done' ? 100 : m.status==='in_progress' ? 45 : 0;

          const fsDate = fs ? fmtShort(fs) : '—';
          const feDate = fe ? fmtShort(fe) : '—';

          return (
            <g key={m.id}>
              {/* Row bg */}
              <rect x={0} y={y} width={TW} height={RH}
                fill={i%2===0?"#FFFFFF05":"#00000000"}/>

              {/* Status indicator strip */}
              <rect x={0} y={y+8} width={3} height={RH-16} rx={1.5} fill={st.color}/>

              {/* Task name */}
              <text x={14} y={y+20} fontSize={13} fontWeight="600" fill="#F5F5F5DD"
                clipPath={`url(#clipl${i})`}>{m.name}</text>
              {/* Status label */}
              <text x={14} y={y+35} fontSize={10} fill={st.color}
                clipPath={`url(#clipl${i})`}>
                {st.label}{m.assignee_agent_id ? `  •  ${AGENT_EMOJI[m.assignee_agent_id]??''} ${m.assignee_agent_id}` : ''}
              </text>
              <clipPath id={`clipl${i}`}><rect x={14} y={y} width={LW-18} height={RH}/></clipPath>

              {/* ── Bars ── */}
              {/* Baseline */}
              {bs&&be&&(
                <rect x={xOf(bs)} y={y+RH/2-BH_BASELINE/2}
                  width={wOf(bs,be)} height={BH_BASELINE}
                  rx={3} fill="#374151"/>
              )}

              {/* Forecast bar */}
              {fs&&fe&&!isDiamond&&(()=>{
                const bx = xOf(fs), bw = wOf(fs,fe);
                const by = y+RH/2-BH_FORECAST/2;
                const fillW = (pct/100)*bw;
                return (
                  <g>
                    {/* background bar */}
                    <rect x={bx} y={by} width={bw} height={BH_FORECAST}
                      rx={4} fill={`${st.bar}55`} stroke={st.bar} strokeWidth={1}
                      className="cursor-pointer"
                      onMouseEnter={e=>setTip({x:e.clientX,y:e.clientY,m})}/>
                    {/* progress fill */}
                    {pct>0&&(
                      <rect x={bx} y={by} width={Math.min(fillW,bw)} height={BH_FORECAST}
                        rx={4} fill={st.bar}/>
                    )}
                    {/* percentage label inside bar */}
                    {bw>35&&pct>0&&(
                      <text x={bx+bw/2} y={by+BH_FORECAST/2+4}
                        fontSize={9} fontWeight="700" fill="white" textAnchor="middle">
                        {pct}%
                      </text>
                    )}
                  </g>
                );
              })()}

              {/* Diamond */}
              {isDiamond&&fs&&(
                <polygon
                  points={`${xOf(fs)},${y+RH/2-10} ${xOf(fs)+10},${y+RH/2} ${xOf(fs)},${y+RH/2+10} ${xOf(fs)-10},${y+RH/2}`}
                  fill={st.bar} stroke={st.color} strokeWidth={1.5}
                  className="cursor-pointer"
                  onMouseEnter={e=>setTip({x:e.clientX,y:e.clientY,m})}/>
              )}

              {/* Actual bar */}
              {as_&&ae&&(
                <rect x={xOf(as_)} y={y+RH/2-BH_FORECAST/2-2}
                  width={wOf(as_,ae)} height={BH_FORECAST+4}
                  rx={4} fill="#4ADE8030" stroke="#4ADE80" strokeWidth={1.5}
                  className="cursor-pointer"
                  onMouseEnter={e=>setTip({x:e.clientX,y:e.clientY,m})}/>
              )}

              {/* Date column */}
              <text x={LW+CW+8} y={y+22} fontSize={10} fill="#F5F5F550">{fsDate}</text>
              <text x={LW+CW+8} y={y+36} fontSize={10} fill="#F5F5F530">→ {feDate}</text>

              {/* Row separator */}
              <line x1={0} y1={y+RH} x2={TW} y2={y+RH} stroke={isPrinting ? "#E5E7EB" : "#1F1F1F"} strokeWidth={1}/>
            </g>
          );
        })}

        {/* Outer border */}
        <rect width={TW} height={TH} fill="none" rx={8} stroke={isPrinting ? "#E5E7EB" : "#D4AF3720"} strokeWidth={1}/>
      </svg>

      {/* Tooltip */}
      {tip&&(
        <div className="fixed z-[100] bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-xl p-3 shadow-2xl text-xs pointer-events-none max-w-[260px]"
          style={{left:tip.x+14,top:tip.y-14}}>
          <p className="font-bold text-[#F5F5F5] mb-2">{tip.m.name}</p>
          <div className="space-y-1 text-[#F5F5F5]/60">
            <p><span className="text-[#D4AF37]/70">Status: </span>
              <span style={{color:MS_STATUS[tip.m.status]?.color}}>{MS_STATUS[tip.m.status]?.label}</span>
            </p>
            {tip.m.assignee_agent_id&&<p>{AGENT_EMOJI[tip.m.assignee_agent_id]??''} {tip.m.assignee_agent_id}</p>}
            {tip.m.baseline_start&&<p>Baseline: {fmtBR(parseD(tip.m.baseline_start)!)} → {tip.m.baseline_end?fmtBR(parseD(tip.m.baseline_end)!):'?'}</p>}
            {tip.m.forecast_start&&<p>Forecast: {fmtBR(parseD(tip.m.forecast_start)!)} → {tip.m.forecast_end?fmtBR(parseD(tip.m.forecast_end)!):'?'}</p>}
            {tip.m.actual_start&&<p className="text-[#4ADE80]/80">Real: {fmtBR(parseD(tip.m.actual_start)!)} {tip.m.actual_end?'→ '+fmtBR(parseD(tip.m.actual_end)!):'(em andamento)'}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function ProjectDetailPage() {
  const params = useParams<{id:string}>();
  const router = useRouter();
  const id = params?.id??"";

  const [project, setProject]     = useState<Project|null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks]         = useState<Task[]>([]);
  const [docs, setDocs]           = useState<Doc[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<Tab>("timeline");
  const [tablesOk, setTablesOk]   = useState(true);
  const [doneOpen, setDoneOpen]   = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const load = useCallback(async()=>{
    if (!id) return;
    setLoading(true);
    // Support both UUID and project code
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let proj: any = null;
    if (isUUID) {
      const {data} = await supabase.from("projects").select("*").eq("id",id).single();
      proj = data;
    } else {
      const {data} = await supabase.from("projects").select("*").eq("code",id).single();
      proj = data;
    }
    if (!proj){setLoading(false);return;}
    setProject(proj as Project);

    const code = (proj as any).code;
    const vertical = (proj as any).vertical;
    const taskQ = code
      ? supabase.from("tasks").select("id,code,title,status,agent_id,vertical,updated_at,completed_at,deliverable_url")
          .eq("project_code",code).order("updated_at",{ascending:false}).limit(60)
      : supabase.from("tasks").select("id,code,title,status,agent_id,vertical,updated_at,completed_at,deliverable_url")
          .eq("vertical",vertical).order("updated_at",{ascending:false}).limit(60);

    const [tRes,mRes,dRes] = await Promise.all([
      taskQ,
      supabase.from("project_milestones").select("*").eq("project_id",id).order("order_index"),
      supabase.from("project_documents").select("*").eq("project_id",id).order("created_at"),
    ]);

    setTasks((tRes.data??[]) as Task[]);
    setTablesOk(!((mRes.error as any)?.code==="PGRST205")||(dRes.error as any)?.code==="PGRST205");
    setMilestones((mRes.data??[]) as Milestone[]);
    setDocs((dRes.data??[]) as Doc[]);
    setLoading(false);
  },[id]);

  useEffect(()=>{load();},[load]);

  // ── PDF Export ──
  const handlePrint = async () => {
    setIsPrinting(true);
    await new Promise(r=>setTimeout(r,500));
    window.print();
    // Delay reset so print dialog doesn't close too fast
    setTimeout(()=>setIsPrinting(false), 1500);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#080808]">
      <Loader2 size={28} className="text-[#D4AF37]/40 animate-spin"/>
    </div>
  );
  if (!project) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#080808] gap-4">
      <p className="text-[#F5F5F5]/40">Projeto não encontrado</p>
      <button onClick={()=>router.push("/projects")}
        className="text-[#D4AF37]/60 hover:text-[#D4AF37] text-sm flex items-center gap-1.5">
        <ArrowLeft size={14}/> Voltar
      </button>
    </div>
  );

  const vc = VERTICAL_COLORS[project.vertical]??"#D4AF37";
  const sc = STATUS_COLORS[project.status]??"#71717A";
  const tasksDone    = tasks.filter(t=>t.status==="done");
  const tasksActive  = tasks.filter(t=>["in_progress","review"].includes(t.status));
  const tasksBlocked = tasks.filter(t=>t.status==="blocked");
  const tasksBacklog = tasks.filter(t=>t.status==="backlog");
  const docsByCat: Record<string,Doc[]> = {};
  for (const d of docs) { (docsByCat[d.category]??=[]).push(d); }
  const today = new Date().toLocaleDateString("pt-BR");

  return (
    <>
      {/* ═══════════════════════════════════════════════════ */}
      {/* PRINT CSS                                          */}
      {/* ═══════════════════════════════════════════════════ */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm 10mm; }
          /* Force white background on everything */
          *, *::before, *::after {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background-color: transparent !important;
            color: #1a1a1a !important;
            border-color: #ddd !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          html, body, #print-area, #__next, main {
            background: white !important;
            background-color: white !important;
            color: #1a1a1a !important;
            font-family: Arial, Helvetica, sans-serif !important;
            font-size: 10pt !important;
          }
          /* Override all Tailwind dark backgrounds */
          [class*="bg-\\[#0"], [class*="bg-\\[#1"], [class*="bg-\\[#2"] {
            background-color: white !important;
          }
          .bg-\\[\\#080808\\], .bg-\\[\\#111\\], .bg-\\[\\#0D0D0D\\],
          .bg-\\[\\#0f0f18\\], .bg-\\[\\#141414\\] {
            background-color: white !important;
          }
          /* Keep colored elements */
          .gantt-bar-done     { background-color: #4ADE80 !important; color: #fff !important; }
          .gantt-bar-active   { background-color: #D4AF37 !important; color: #fff !important; }
          .gantt-bar-pending  { background-color: #9CA3AF !important; }
          .print-section-title { color: #1a1a1a !important; border-bottom: 2px solid #D4AF37 !important; }
          .no-print { display: none !important; }
          .print-section { page-break-before: always; }
          .print-section:first-of-type { page-break-before: avoid; }

          /* Print header */
          .print-header {
            display: flex !important;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #D4AF37 !important;
            padding-bottom: 8px;
            margin-bottom: 16px;
            background: white !important;
          }
          .print-header h1 { font-size: 16pt; font-weight: 700; color: #1a1a1a !important; }
          .print-header .meta { font-size: 9pt; color: #555 !important; }

          /* Print footer */
          .print-footer {
            display: flex !important;
            position: fixed;
            bottom: 6mm;
            left: 10mm;
            right: 10mm;
            font-size: 8pt;
            color: #888 !important;
            border-top: 1px solid #ccc !important;
            padding-top: 4px;
            justify-content: space-between;
            background: white !important;
          }

          /* Tables */
          .print-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9pt; }
          .print-table th { background: #f3f3f3 !important; border: 1px solid #ccc !important; padding: 5px 8px; font-weight: 700; color: #333 !important; }
          .print-table td { border: 1px solid #ddd !important; padding: 4px 8px; color: #333 !important; background: transparent !important; }
          .print-table tr:nth-child(even) td { background: #f9f9f9 !important; }

          /* Section titles */
          .print-section-title { font-size: 12pt; font-weight: 700; color: #1a1a1a !important; margin: 0 0 8px 0; border-bottom: 2px solid #D4AF37 !important; padding-bottom: 4px; background: transparent !important; }

          /* SVG — force light theme (only target backgrounds, NOT data bars) */
          svg { max-width: 100%; height: auto; }
          svg rect.gantt-bg { fill: #ffffff !important; }
          svg rect.gantt-header-bg { fill: #f3f3f3 !important; }
          svg rect.gantt-row-even { fill: #f9f9f9 !important; }
          svg rect.gantt-row-odd { fill: #ffffff !important; }
          svg rect.gantt-baseline { fill: #9CA3AF !important; }
          svg rect.gantt-forecast-done { fill: #22c55e !important; }
          svg rect.gantt-forecast-active { fill: #D4AF37 !important; }
          svg rect.gantt-forecast-pending { fill: #94a3b8 !important; }
          svg line { stroke: #e2e8f0 !important; }
          svg line.gantt-today { stroke: #ef4444 !important; stroke-width: 2 !important; }
          svg text { fill: #1a1a1a !important; }
          svg path.gantt-dep { stroke: #D4AF37 !important; opacity: 0.8 !important; }
        }
        .print-header, .print-footer { display: none; }
      `}</style>

      <div className="min-h-screen bg-[#080808] text-[#F5F5F5]">

        {/* ═══════════════════════════════════════════════════ */}
        {/* PRINT HEADER (hidden on screen)                   */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="print-header">
          <div>
            <div style={{fontSize:9,color:'#D4AF37',fontWeight:700,letterSpacing:2}}>STM GROUP — PANTEÃO DO OLIMPO</div>
            <h1 style={{margin:'4px 0 0'}}>{project.name}</h1>
          </div>
          <div className="meta" style={{textAlign:'right'}}>
            <div><strong>Código:</strong> {project.code??'—'}</div>
            <div><strong>Vertical:</strong> {project.vertical}</div>
            <div><strong>Status:</strong> {STATUS_LABELS[project.status]}</div>
            <div><strong>Progresso:</strong> {project.progress}%</div>
            <div><strong>Gerado em:</strong> {today}</div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* STICKY HEADER (screen only)                       */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="no-print sticky top-0 z-30 bg-[#080808]/96 backdrop-blur border-b border-[#D4AF37]/10">
          <div className="px-6 py-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <button onClick={()=>router.push("/projects")}
                className="flex items-center gap-1.5 text-[#F5F5F5]/40 hover:text-[#F5F5F]/70 text-sm transition-colors">
                <ArrowLeft size={14}/> Voltar
              </button>
              <button onClick={handlePrint} disabled={isPrinting}
                className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/25 text-[#D4AF37] text-xs rounded-xl transition-colors disabled:opacity-60">
                <Printer size={13}/>
                {isPrinting?"Preparando PDF…":"Exportar PDF"}
              </button>
            </div>

            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {project.code&&<span className="text-xs font-mono text-[#D4AF37]/50">{project.code}</span>}
                  <span className="text-[10px] px-2 py-0.5 rounded border font-medium"
                    style={{color:vc,borderColor:`${vc}30`,backgroundColor:`${vc}10`}}>
                    {project.vertical}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded border"
                    style={{color:sc,borderColor:`${sc}30`,backgroundColor:`${sc}10`}}>
                    {STATUS_LABELS[project.status]??project.status}
                  </span>
                  {project.phase&&(
                    <span className="text-[10px] px-2 py-0.5 rounded border border-[#F5F5F5]/10 text-[#F5F5F5]/40 capitalize">
                      {project.phase}
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold">{project.name}</h1>
                {project.description&&<p className="text-sm text-[#F5F5F5]/40 mt-1">{project.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                {project.notion_url&&<ExtLink href={project.notion_url} label="Notion"/>}
                {project.trello_url&&<ExtLink href={project.trello_url} label="Trello"/>}
                {project.drive_url &&<ExtLink href={project.drive_url}  label="Drive"/>}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-[#F5F5F5]/30 uppercase tracking-wider">Progresso Geral</span>
                <span className="text-xs font-bold" style={{color:vc}}>{project.progress}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{width:`${project.progress}%`,backgroundColor:vc}}/>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex gap-6 mt-4 flex-wrap text-xs">
              {project.lead_agent_id&&<Metric label="Lead">{AGENT_EMOJI[project.lead_agent_id]??''} {project.lead_agent_id}</Metric>}
              {project.priority&&<Metric label="Prioridade"><span style={{color:PRIORITY_COLOR[project.priority]}}>{PRIORITY_LABEL[project.priority]}</span></Metric>}
              {project.start_date&&<Metric label="Início">{new Date(project.start_date).toLocaleDateString("pt-BR")}</Metric>}
              {project.deadline&&<Metric label="Deadline"><span className="text-[#F87171]">{new Date(project.deadline).toLocaleDateString("pt-BR")}</span></Metric>}
              <Metric label="Tasks">{tasksActive.length} ativas · {tasksDone.length} concluídas</Metric>
              <Metric label="Milestones">{milestones.filter(m=>m.status==='done').length}/{milestones.length} feitos</Metric>
            </div>

            {project.tags?.length&&(
              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                <Tag size={10} className="text-[#D4AF37]/30"/>
                {project.tags.map(t=>(
                  <span key={t} className="text-[10px] px-2 py-0.5 bg-[#D4AF37]/8 border border-[#D4AF37]/15 text-[#D4AF37]/60 rounded-full">#{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex px-6 max-w-7xl mx-auto border-t border-[#D4AF37]/10">
            {(["timeline","gantt","atividades","documentos"] as Tab[]).map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                className={`px-5 py-3 text-xs font-medium transition-colors border-b-2 -mb-px ${
                  tab===t?"text-[#D4AF37] border-[#D4AF37]":"text-[#F5F5F5]/40 border-transparent hover:text-[#F5F5F5]/70"
                }`}>
                {t==="timeline"?"🗂️ Timeline":t==="gantt"?"📅 Gantt":t==="atividades"?"✅ Atividades":"📁 Documentos"}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* CONTENT                                           */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="px-6 py-6 max-w-7xl mx-auto">

          {/* ── TIMELINE ── */}
          {tab==="timeline" && !isPrinting && (
            <TimelineKanban tasks={tasks} project={project} />
          )}

          {/* ── GANTT ── */}
          {(isPrinting || tab==="gantt") && (
            <div className="print-section">
              {isPrinting&&<h2 className="print-section-title">📅 Cronograma / Gantt</h2>}
              {tablesOk
                ? <GanttChart milestones={milestones} isPrinting={isPrinting}/>
                : <MigrationNotice/>
              }
            </div>
          )}

          {/* ── ATIVIDADES ── */}
          {(isPrinting || tab==="atividades") && (
            <div className={`print-section ${isPrinting?"mt-8":""}`}>
              {isPrinting&&<h2 className="print-section-title">✅ Atividades</h2>}

              {/* Print table */}
              {isPrinting ? (
                <table className="print-table">
                  <thead>
                    <tr>
                      <th>Código</th><th>Tarefa</th><th>Status</th>
                      <th>Agente</th><th>Atualizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(t=>(
                      <tr key={t.id}>
                        <td style={{fontFamily:'monospace',fontSize:'8pt'}}>{t.code??'—'}</td>
                        <td>{t.title}</td>
                        <td>{t.status.replace('_',' ')}</td>
                        <td>{t.agent_id??'—'}</td>
                        <td style={{whiteSpace:'nowrap'}}>{new Date(t.updated_at).toLocaleDateString("pt-BR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="space-y-4">
                  {!tasks.length&&<EmptyMsg text="Nenhuma tarefa vinculada a este projeto"/>}
                  {tasksBlocked.length>0&&<TaskGroup label="🚫 Bloqueado" tasks={tasksBlocked} color="#F87171" defaultOpen/>}
                  {tasksActive.length>0&&<TaskGroup label="🔄 Em Andamento" tasks={tasksActive} color="#D4AF37" defaultOpen/>}
                  {tasksBacklog.length>0&&<TaskGroup label="📋 Backlog" tasks={tasksBacklog} color="#71717A" defaultOpen={!tasksActive.length}/>}
                  {tasksDone.length>0&&(
                    <TaskGroup label="✅ Concluídas" tasks={tasksDone} color="#4ADE80"
                      defaultOpen={doneOpen} onToggle={()=>setDoneOpen(o=>!o)}/>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── DOCUMENTOS ── */}
          {(isPrinting || tab==="documentos") && (
            <div className={`print-section ${isPrinting?"mt-8":""}`}>
              {isPrinting&&<h2 className="print-section-title">📁 Documentos</h2>}

              {!tablesOk ? <MigrationNotice/> : docs.length===0 ? (
                isPrinting ? (
                  <p style={{color:'#666',fontStyle:'italic'}}>Nenhum documento adicionado ainda.</p>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 border border-dashed border-[#D4AF37]/15 rounded-xl">
                    <p className="text-[#F5F5F5]/30 text-sm mb-1">Nenhum documento adicionado ainda.</p>
                    <p className="text-[#F5F5F5]/20 text-xs">Use o botão + para adicionar.</p>
                  </div>
                )
              ) : isPrinting ? (
                <table className="print-table">
                  <thead>
                    <tr><th>Título</th><th>Categoria</th><th>Tipo</th><th>Drive</th><th>Notas</th></tr>
                  </thead>
                  <tbody>
                    {docs.map(d=>(
                      <tr key={d.id}>
                        <td>{d.title}</td>
                        <td>{DOC_CATS[d.category]?.label??d.category}</td>
                        <td>{d.file_type}</td>
                        <td style={{fontSize:'8pt',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {d.drive_url??d.drive_path??'—'}
                        </td>
                        <td>{d.notes??'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="space-y-6">
                  {Object.entries(docsByCat).map(([cat,list])=>{
                    const ci = DOC_CATS[cat]??DOC_CATS.geral;
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-3">
                          <span style={{color:ci.color}}>{ci.icon}</span>
                          <h3 className="text-xs font-semibold uppercase tracking-widest" style={{color:ci.color}}>
                            {ci.label} ({list.length})
                          </h3>
                        </div>
                        <div className="space-y-2">
                          {list.map(doc=>(
                            <div key={doc.id}
                              className="flex items-center gap-3 bg-[#111] border border-[#D4AF37]/8 hover:border-[#D4AF37]/20 rounded-xl px-4 py-3 transition-colors">
                              <span className="text-lg flex-shrink-0">{FILE_ICONS[doc.file_type]??"📄"}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-[#F5F5F5]/85 font-medium truncate">{doc.title}</p>
                                {doc.notes&&<p className="text-[10px] text-[#F5F5F5]/30 mt-0.5 truncate">{doc.notes}</p>}
                              </div>
                              <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded border border-white/8 text-[#F5F5F5]/40 capitalize flex-shrink-0">{doc.file_type}</span>
                              {doc.drive_url&&(
                                <a href={doc.drive_url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[#D4AF37]/50 hover:text-[#D4AF37] text-xs transition-colors flex-shrink-0">
                                  <ExternalLink size={12}/> Abrir
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Print footer ── */}
        <div className="print-footer">
          <span>Gerado em {today} pelo Panteão do Olimpo — STM Group</span>
          <span>{project.name} · {project.code??'—'} · {project.vertical}</span>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// TIMELINE KANBAN COMPONENT
// ═══════════════════════════════════════════════════════════════

const TASK_STATUS_COLS = [
  { key: "backlog",     label: "Backlog",      color: "#71717A", emoji: "📋" },
  { key: "in_progress", label: "Em Progresso", color: "#D4AF37", emoji: "🔄" },
  { key: "review",      label: "Em Review",    color: "#06B6D4", emoji: "🔍" },
  { key: "blocked",     label: "Bloqueado",    color: "#F87171", emoji: "🚫" },
  { key: "done",        label: "Concluído",    color: "#4ADE80", emoji: "✅" },
];

function timeAgo(d: string) {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: ptBR }); }
  catch { return "—"; }
}

function TimelineKanban({ tasks, project }: { tasks: Task[]; project: Project }) {
  const tasksByStatus: Record<string, Task[]> = {};
  for (const col of TASK_STATUS_COLS) tasksByStatus[col.key] = [];
  for (const t of tasks) {
    if (tasksByStatus[t.status]) tasksByStatus[t.status].push(t);
    else tasksByStatus["backlog"] = [...(tasksByStatus["backlog"] ?? []), t];
  }

  const vc = VERTICAL_COLORS[project.vertical] ?? "#D4AF37";
  const total = tasks.length;
  const done = tasksByStatus["done"]?.length ?? 0;
  const progress = total > 0 ? Math.round((done / total) * 100) : (project.progress ?? 0);

  // Agents involved (unique, from tasks)
  const agentIds = Array.from(new Set(tasks.map(t => t.agent_id).filter(Boolean))) as string[];
  // Deliverables
  const deliverables = tasks.filter(t => t.deliverable_url);

  return (
    <div className="space-y-6">
      {/* Metrics bar */}
      <div className="bg-[#111] border border-[#D4AF37]/10 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] text-[#F5F5F5]/30 uppercase tracking-wider">Progresso Real (tasks)</span>
          <span className="text-sm font-bold" style={{ color: vc }}>{progress}%</span>
        </div>
        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden mb-4">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: vc }} />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-center">
          {TASK_STATUS_COLS.map(col => (
            <div key={col.key} className="bg-white/3 rounded-xl p-2">
              <p className="text-lg font-bold" style={{ color: col.color }}>{tasksByStatus[col.key]?.length ?? 0}</p>
              <p className="text-[9px] text-[#F5F5F5]/30 mt-0.5">{col.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5-column kanban */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {TASK_STATUS_COLS.map(col => (
          <div key={col.key} className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden">
            {/* Column header */}
            <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between"
              style={{ borderTopColor: col.color, borderTopWidth: 2 }}>
              <span className="text-[11px] font-semibold" style={{ color: col.color }}>
                {col.emoji} {col.label}
              </span>
              <span className="text-[10px] text-[#F5F5F5]/30 bg-white/5 px-1.5 py-0.5 rounded-full">
                {tasksByStatus[col.key]?.length ?? 0}
              </span>
            </div>
            {/* Tasks */}
            <div className="p-2 space-y-1.5 max-h-80 overflow-y-auto">
              {(tasksByStatus[col.key] ?? []).length === 0 && (
                <p className="text-[10px] text-[#F5F5F5]/15 text-center py-3">Nenhuma</p>
              )}
              {(tasksByStatus[col.key] ?? []).map(t => (
                <a
                  key={t.id}
                  href={`/tasks?filter=${t.code ?? t.id}`}
                  className="block bg-[#111] hover:bg-[#1a1a1a] border border-white/5 hover:border-[#D4AF37]/20 rounded-xl p-2.5 transition-all"
                >
                  {t.code && (
                    <span className="text-[9px] font-mono text-[#D4AF37]/40 block mb-0.5">{t.code}</span>
                  )}
                  <p className="text-[11px] text-[#F5F5F5]/80 leading-snug line-clamp-2">{t.title}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    {t.agent_id ? (
                      <span className="text-[10px]">{AGENT_EMOJI[t.agent_id] ?? "🤖"}</span>
                    ) : <span />}
                    <span className="text-[9px] text-[#F5F5F5]/20">{timeAgo(t.updated_at)}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Section 3 — Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Agents */}
        <div className="bg-[#111] border border-[#D4AF37]/10 rounded-2xl p-4">
          <h3 className="text-[10px] uppercase tracking-widest text-[#D4AF37]/50 mb-3 font-semibold">Agentes Envolvidos</h3>
          {agentIds.length === 0 ? (
            <p className="text-xs text-[#F5F5F5]/20">Nenhum agente identificado</p>
          ) : (
            <div className="space-y-2">
              {agentIds.map(a => (
                <div key={a} className="flex items-center gap-2 text-xs text-[#F5F5F5]/60">
                  <span className="text-base">{AGENT_EMOJI[a] ?? "🤖"}</span>
                  <span>{AGENT_NAMES[a] ?? a}</span>
                  <span className="text-[10px] text-[#F5F5F5]/20">
                    ({tasks.filter(t => t.agent_id === a).length} tasks)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deliverables */}
        <div className="bg-[#111] border border-[#D4AF37]/10 rounded-2xl p-4">
          <h3 className="text-[10px] uppercase tracking-widest text-[#D4AF37]/50 mb-3 font-semibold">Deliverables</h3>
          {deliverables.length === 0 ? (
            <p className="text-xs text-[#F5F5F5]/20">Nenhum deliverable ainda</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {deliverables.map(t => (
                <a key={t.id} href={t.deliverable_url!} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors">
                  <ExternalLink size={10} className="flex-shrink-0" />
                  <span className="truncate">{t.code ?? t.title}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Last update */}
        <div className="bg-[#111] border border-[#D4AF37]/10 rounded-2xl p-4">
          <h3 className="text-[10px] uppercase tracking-widest text-[#D4AF37]/50 mb-3 font-semibold">Última Atividade</h3>
          {tasks.length > 0 ? (
            <div>
              <p className="text-xs text-[#F5F5F5]/50 mb-1">
                {timeAgo(tasks[0].updated_at)}
              </p>
              {tasks[0].code && <p className="text-[10px] font-mono text-[#D4AF37]/30">{tasks[0].code}</p>}
              <p className="text-[11px] text-[#F5F5F5]/60 mt-0.5 line-clamp-2">{tasks[0].title}</p>
            </div>
          ) : (
            <p className="text-xs text-[#F5F5F5]/20">Sem atividade registrada</p>
          )}
        </div>
      </div>
    </div>
  );
}

const AGENT_NAMES: Record<string, string> = {
  mariana: "Mariana", atena: "Atena", hefesto: "Hefesto",
  apollo: "Apollo", afrodite: "Afrodite", hera: "Hera",
  ares: "Ares", hestia: "Héstia",
};

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function ExtLink({href,label}:{href:string;label:string}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-[#F5F5F5]/50 hover:text-[#F5F5F5] transition-colors">
      <ExternalLink size={11}/> {label}
    </a>
  );
}
function Metric({label,children}:{label:string;children:React.ReactNode}) {
  return (
    <div>
      <p className="text-[10px] text-[#F5F5F5]/25 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xs text-[#F5F5F5]/70">{children}</p>
    </div>
  );
}
function EmptyMsg({text}:{text:string}) {
  return <div className="text-center py-12 text-[#F5F5F5]/30 text-sm">{text}</div>;
}
function MigrationNotice() {
  return (
    <div className="border border-dashed border-[#D4AF37]/20 rounded-xl p-8 text-center">
      <p className="text-[#D4AF37]/60 font-medium mb-2">Tabelas não encontradas</p>
      <p className="text-[#F5F5F5]/30 text-sm">Execute: <code className="text-[#D4AF37]/50">node scripts/migrate.js</code></p>
    </div>
  );
}
function TaskGroup({label,tasks,color,defaultOpen,onToggle}:{
  label:string;tasks:Task[];color:string;defaultOpen?:boolean;onToggle?:()=>void;
}) {
  const [open,setOpen] = useState(defaultOpen??true);
  const isOpen = onToggle!==undefined?defaultOpen:open;
  const toggle = onToggle??(()=>setOpen(o=>!o));
  return (
    <div className="border border-[#D4AF37]/8 rounded-xl overflow-hidden">
      <button onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#111] hover:bg-[#141414] transition-colors">
        <div className="flex items-center gap-2">
          {isOpen?<ChevronDown size={14} className="text-[#F5F5F5]/30"/>:<ChevronRight size={14} className="text-[#F5F5F5]/30"/>}
          <span className="text-xs font-semibold" style={{color}}>{label}</span>
          <span className="text-[10px] text-[#F5F5F5]/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/8">{tasks.length}</span>
        </div>
      </button>
      {isOpen&&(
        <div className="divide-y divide-[#D4AF37]/5">
          {tasks.map(t=><TaskRow key={t.id} task={t}/>)}
        </div>
      )}
    </div>
  );
}
function TaskRow({task}:{task:Task}) {
  const icon: Record<string,React.ReactNode> = {
    done:        <CheckCircle size={13} className="text-emerald-400 flex-shrink-0"/>,
    in_progress: <Loader2 size={13} className="text-[#D4AF37] animate-spin flex-shrink-0"/>,
    review:      <Clock size={13} className="text-blue-400 flex-shrink-0"/>,
    blocked:     <AlertCircle size={13} className="text-red-400 flex-shrink-0"/>,
    backlog:     <ListTodo size={13} className="text-[#F5F5F5]/25 flex-shrink-0"/>,
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#0D0D0D] hover:bg-[#111] transition-colors">
      {icon[task.status]??<ListTodo size={13} className="text-[#F5F5F5]/20 flex-shrink-0"/>}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {task.code&&<span className="text-[10px] font-mono text-[#D4AF37]/40">{task.code}</span>}
          <span className="text-sm text-[#F5F5F5]/80 truncate">{task.title}</span>
        </div>
        <p className="text-[10px] text-[#F5F5F5]/25 mt-0.5">
          {formatDistanceToNow(new Date(task.updated_at),{addSuffix:true,locale:ptBR})}
        </p>
      </div>
      {task.agent_id&&<span className="text-sm flex-shrink-0">{AGENT_EMOJI[task.agent_id]??""}</span>}
      {task.deliverable_url&&(
        <a href={task.deliverable_url} target="_blank" rel="noopener noreferrer"
          className="text-[#D4AF37]/40 hover:text-[#D4AF37] transition-colors flex-shrink-0">
          <ExternalLink size={11}/>
        </a>
      )}
    </div>
  );
}
