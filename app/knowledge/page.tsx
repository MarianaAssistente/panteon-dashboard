"use client";

import { useState } from "react";
import { BookOpen, Cpu, Lightbulb, GraduationCap } from "lucide-react";
import KnowledgeBaseTab from "@/components/tabs/KnowledgeBaseTab";
import SkillsTab from "@/components/tabs/SkillsTab";
import LessonsTab from "@/components/tabs/LessonsTab";
import DiretrizesTab from "@/components/tabs/DiretrizesTab";

type Tab = "base" | "skills" | "licoes" | "diretrizes";

const TABS: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "base",       label: "Base de Conhecimento", icon: <BookOpen size={14} />,      desc: "Memória permanente do Panteão" },
  { id: "skills",     label: "Skills",               icon: <Cpu size={14} />,           desc: "17 capacidades instaladas" },
  { id: "licoes",     label: "Lições Aprendidas",    icon: <Lightbulb size={14} />,     desc: "Arquitetura e decisões consolidadas" },
  { id: "diretrizes", label: "Diretrizes",            icon: <GraduationCap size={14} />, desc: "VTSD 2.0 — 23 diretrizes de Leandro Ladeira" },
];

export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState<Tab>("base");
  const current = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="flex-1 min-h-screen flex flex-col">
      {/* Page header */}
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-3 mb-1">
          {current.icon && <span className="text-[#D4AF37]">{current.icon}</span>}
          <h1 className="text-xl font-semibold text-[#F5F5F5]">Conhecimento</h1>
        </div>
        <p className="text-[#F5F5F5]/40 text-sm mb-5">{current.desc}</p>

        {/* Sub-tabs */}
        <div className="flex gap-1 border-b border-[#D4AF37]/10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "text-[#D4AF37] border-[#D4AF37]"
                  : "text-[#F5F5F5]/40 border-transparent hover:text-[#F5F5F5]/70"
              }`}
            >
              <span className={activeTab === tab.id ? "text-[#D4AF37]" : "text-[#F5F5F5]/25"}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "base"       && <KnowledgeBaseTab />}
        {activeTab === "skills"     && <SkillsTab />}
        {activeTab === "licoes"     && <LessonsTab />}
        {activeTab === "diretrizes" && <DiretrizesTab />}
      </div>
    </div>
  );
}
