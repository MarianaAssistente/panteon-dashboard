"use client";

import { useState } from "react";
import AgentOrgPanel from "@/components/AgentOrgPanel";
import { AGENTS_PROFILE } from "@/lib/agents-data";
import type { AgentProfile } from "@/lib/agents-data";

export default function OrganogramaPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);

  const ceo = AGENTS_PROFILE.find((a) => a.id === "mariana")!;
  const reports = AGENTS_PROFILE.filter((a) => a.reports_to === "mariana");

  return (
    <>
      {/* Main org chart area */}
      <div className="overflow-auto p-6 min-h-screen">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-[#F5F5F5]">Organograma</h1>
          <p className="text-[#F5F5F5]/40 text-sm mt-1">Clique em um agente para ver detalhes completos</p>
        </div>

        {/* CEO */}
        <div className="flex justify-center mb-2">
          <AgentNode
            agent={ceo}
            selected={selectedAgent?.id === ceo.id}
            onClick={() => setSelectedAgent(selectedAgent?.id === ceo.id ? null : ceo)}
          />
        </div>

        {/* Vertical connector from CEO */}
        <div className="flex justify-center mb-0">
          <div className="w-px h-8 bg-[#D4AF37]/25" />
        </div>

        {/* Horizontal connector bar */}
        <div className="flex justify-center mb-0">
          <div className="border-t border-[#D4AF37]/20" style={{ width: `${reports.length * 152}px` }} />
        </div>

        {/* Vertical drops to each report */}
        <div className="flex justify-center gap-2 mb-2">
          {reports.map((a) => (
            <div key={a.id} className="w-36 flex justify-center">
              <div className="w-px h-6 bg-[#D4AF37]/20" />
            </div>
          ))}
        </div>

        {/* Direct reports grid */}
        <div className="flex justify-center gap-2 flex-wrap">
          {reports.map((agent) => (
            <AgentNode
              key={agent.id}
              agent={agent}
              selected={selectedAgent?.id === agent.id}
              onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-12 flex justify-center">
          <div className="flex flex-wrap gap-6 justify-center">
            {AGENTS_PROFILE.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAgent(selectedAgent?.id === a.id ? null : a)}
                className="flex items-center gap-2 text-xs text-[#F5F5F5]/40 hover:text-[#F5F5F5]/70 transition-colors"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                {a.name} · {a.role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Side panel — overlay fixo (fora do container de scroll, no nível raiz) */}
      {selectedAgent && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setSelectedAgent(null)}
          />
          <AgentOrgPanel
            agent={selectedAgent}
            onClose={() => setSelectedAgent(null)}
          />
        </>
      )}
    </>
  );
}

function AgentNode({
  agent,
  selected,
  onClick,
}: {
  agent: AgentProfile;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-36 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
        selected
          ? "border-[#D4AF37]/50 bg-[#D4AF37]/8 shadow-lg shadow-[#D4AF37]/10 scale-105"
          : "border-[#D4AF37]/10 bg-[#111] hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 hover:scale-102"
      }`}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 transition-all duration-200"
        style={{
          backgroundColor: `${agent.color}15`,
          borderColor: selected ? agent.color : `${agent.color}35`,
        }}
      >
        {agent.emoji}
      </div>
      <div className="text-center">
        <p className="text-[#F5F5F5] text-sm font-semibold leading-tight">{agent.name}</p>
        <p className="text-xs font-bold mt-0.5" style={{ color: agent.color }}>
          {agent.role}
        </p>
        <p className="text-[10px] text-[#F5F5F5]/30 mt-0.5 leading-tight">{agent.title.replace("Chief ", "").replace(" Officer", "")}</p>
      </div>
    </button>
  );
}
