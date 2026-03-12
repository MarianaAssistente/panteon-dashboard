"use client";

import { useEffect, useState } from "react";
import { X, Zap, Brain, Star, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AgentProfile } from "@/lib/agents-data";

interface Task {
  id: string;
  code?: string;
  title: string;
  status: string;
  approval_status?: string;
  vertical?: string;
  updated_at: string;
  completed_at?: string;
  deliverable_url?: string;
}

interface Memory {
  code: string;
  title: string;
  category: string;
  importance: string;
  content: string;
}

const MODEL_LABEL: Record<string, string> = {
  "claude-sonnet-4-6": "Sonnet 4.6",
  "claude-haiku-4-5": "Haiku 4.5",
};

const STATUS_COLOR: Record<string, string> = {
  done: "text-emerald-400",
  in_progress: "text-[#D4AF37]",
  blocked: "text-red-400",
  review: "text-blue-400",
  backlog: "text-[#F5F5F5]/30",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  done: <CheckCircle size={12} className="text-emerald-400" />,
  in_progress: <Loader2 size={12} className="text-[#D4AF37] animate-spin" />,
  blocked: <AlertCircle size={12} className="text-red-400" />,
  review: <Clock size={12} className="text-blue-400" />,
};

export default function AgentOrgPanel({
  agent,
  onClose,
}: {
  agent: AgentProfile;
  onClose: () => void;
}) {
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"perfil" | "tarefas" | "memoria">("perfil");

  useEffect(() => {
    setLoading(true);
    setActiveTab("perfil");

    Promise.all([
      // Tarefas ativas
      supabase
        .from("tasks")
        .select("id, code, title, status, approval_status, vertical, updated_at, completed_at, deliverable_url")
        .eq("agent_id", agent.id)
        .in("status", ["in_progress", "review", "blocked"])
        .order("updated_at", { ascending: false })
        .limit(5),

      // Tarefas recentes concluídas
      supabase
        .from("tasks")
        .select("id, code, title, status, approval_status, vertical, updated_at, completed_at, deliverable_url")
        .eq("agent_id", agent.id)
        .eq("status", "done")
        .order("completed_at", { ascending: false })
        .limit(8),

      // Memórias/conhecimento associado ao agente
      supabase
        .from("knowledge")
        .select("code, title, category, importance, content")
        .or(`tags.cs.{${agent.id}},related_project_code.like.%${agent.id.toUpperCase()}%`)
        .order("created_at", { ascending: false })
        .limit(5),
    ]).then(([active, recent, mem]) => {
      setActiveTasks(active.data ?? []);
      setRecentTasks(recent.data ?? []);
      setMemories(mem.data ?? []);
      setLoading(false);
    });
  }, [agent.id]);

  const totalDone = recentTasks.length;

  return (
    <aside className="w-[420px] h-full bg-[#0A0A0A] border-l border-[#D4AF37]/10 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#D4AF37]/10 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 flex-shrink-0"
            style={{ backgroundColor: `${agent.color}15`, borderColor: `${agent.color}50` }}
          >
            {agent.emoji}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#F5F5F5]">{agent.name}</h2>
            <p className="text-sm font-bold" style={{ color: agent.color }}>{agent.role} · {agent.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] bg-[#D4AF37]/8 border border-[#D4AF37]/15 text-[#D4AF37]/70 px-2 py-0.5 rounded-full">
                {MODEL_LABEL[agent.model] ?? agent.model}
              </span>
              {activeTasks.length > 0 && (
                <span className="text-[10px] bg-[#D4AF37]/8 border border-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse inline-block" />
                  {activeTasks.length} ativa{activeTasks.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[#F5F5F5]/30 hover:text-[#F5F5F5] transition-colors mt-1"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#D4AF37]/10">
        {(["perfil", "tarefas", "memoria"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-medium transition-colors capitalize ${
              activeTab === tab
                ? "text-[#D4AF37] border-b-2 border-[#D4AF37]"
                : "text-[#F5F5F5]/40 hover:text-[#F5F5F5]/70"
            }`}
          >
            {tab === "perfil" ? "Perfil" : tab === "tarefas" ? "Tarefas" : "Memória"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={20} className="text-[#D4AF37]/40 animate-spin" />
          </div>
        ) : (
          <>
            {/* ── PERFIL ── */}
            {activeTab === "perfil" && (
              <>
                <Section icon={<Star size={13} />} title="Missão">
                  <p className="text-[#F5F5F5]/60 text-sm leading-relaxed">{agent.mission}</p>
                </Section>

                <Section icon={<Brain size={13} />} title="Personalidade">
                  <p className="text-[#F5F5F5]/60 text-sm leading-relaxed">{agent.personality}</p>
                </Section>

                <Section icon={<Zap size={13} />} title="Capacidades">
                  <ul className="space-y-1.5">
                    {agent.capabilities.map((cap) => (
                      <li key={cap} className="flex items-start gap-2 text-sm text-[#F5F5F5]/60">
                        <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: agent.color }} />
                        {cap}
                      </li>
                    ))}
                  </ul>
                </Section>

                <Section icon={<Star size={13} />} title="Skills Disponíveis">
                  <div className="flex flex-wrap gap-2">
                    {agent.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs px-2.5 py-1 rounded-lg border font-mono"
                        style={{ borderColor: `${agent.color}30`, color: agent.color, backgroundColor: `${agent.color}08` }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </Section>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Tarefas Concluídas" value={totalDone} color={agent.color} />
                  <StatCard label="Em Andamento" value={activeTasks.length} color={agent.color} />
                </div>
              </>
            )}

            {/* ── TAREFAS ── */}
            {activeTab === "tarefas" && (
              <>
                {activeTasks.length > 0 && (
                  <Section icon={<Loader2 size={13} className="animate-spin" />} title="Em Andamento">
                    <div className="space-y-2">
                      {activeTasks.map((t) => (
                        <TaskRow key={t.id} task={t} />
                      ))}
                    </div>
                  </Section>
                )}

                {recentTasks.length > 0 ? (
                  <Section icon={<CheckCircle size={13} />} title="Últimas Concluídas">
                    <div className="space-y-2">
                      {recentTasks.map((t) => (
                        <TaskRow key={t.id} task={t} />
                      ))}
                    </div>
                  </Section>
                ) : (
                  <p className="text-[#F5F5F5]/30 text-sm text-center py-8">Nenhuma tarefa concluída ainda</p>
                )}
              </>
            )}

            {/* ── MEMÓRIA ── */}
            {activeTab === "memoria" && (
              <>
                {memories.length > 0 ? (
                  <Section icon={<Brain size={13} />} title="Base de Conhecimento">
                    <div className="space-y-3">
                      {memories.map((m) => (
                        <div key={m.code} className="bg-[#111] border border-[#D4AF37]/8 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono text-[#D4AF37]/50">{m.code}</span>
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded capitalize"
                              style={{
                                backgroundColor: m.importance === "crítico" ? "#ef444420" : "#D4AF3720",
                                color: m.importance === "crítico" ? "#ef4444" : "#D4AF37",
                              }}
                            >
                              {m.importance}
                            </span>
                          </div>
                          <p className="text-sm text-[#F5F5F5]/80 font-medium">{m.title}</p>
                          <p className="text-xs text-[#F5F5F5]/40 mt-1 line-clamp-2">{m.content}</p>
                          <span className="text-[10px] text-[#F5F5F5]/25 mt-1 block capitalize">{m.category}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                ) : (
                  <p className="text-[#F5F5F5]/30 text-sm text-center py-8">Nenhuma memória registrada ainda</p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[#D4AF37]/60">{icon}</span>
        <h3 className="text-xs font-semibold text-[#F5F5F5]/40 uppercase tracking-widest">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[#111] border border-[#D4AF37]/8 rounded-xl p-3 text-center">
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-[#F5F5F5]/40 mt-0.5">{label}</p>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  return (
    <div className="flex items-start gap-2 bg-[#111] border border-[#D4AF37]/8 rounded-xl p-3">
      <span className="mt-0.5 flex-shrink-0">{STATUS_ICON[task.status] ?? <Clock size={12} className="text-[#F5F5F5]/30" />}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {task.code && <span className="text-[10px] font-mono text-[#D4AF37]/40">{task.code}</span>}
          {task.vertical && (
            <span className="text-[10px] text-[#F5F5F5]/25 truncate">{task.vertical}</span>
          )}
        </div>
        <p className="text-sm text-[#F5F5F5]/80 leading-snug mt-0.5 truncate">{task.title}</p>
        <p className="text-[10px] text-[#F5F5F5]/30 mt-1">
          {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true, locale: ptBR })}
        </p>
        {task.deliverable_url && (
          <a
            href={task.deliverable_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#D4AF37]/50 hover:text-[#D4AF37] transition-colors mt-1 block"
          >
            Ver entregável →
          </a>
        )}
      </div>
      <span className={`text-[10px] font-medium flex-shrink-0 capitalize ${STATUS_COLOR[task.status] ?? "text-[#F5F5F5]/30"}`}>
        {task.status.replace("_", " ")}
      </span>
    </div>
  );
}
