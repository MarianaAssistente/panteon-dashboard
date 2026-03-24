"use client";

import { useState } from "react";

const AGENTS = [
  { id: "shared",   name: "Compartilhado",  icon: "🌐", color: "text-yellow-400", files: ["STATUS.md","DECISIONS.md","LESSONS.md","PEOPLE.md"] },
  { id: "mariana",  name: "Mariana (CEO)",   icon: "👑", color: "text-yellow-400", files: ["decisions.md","lessons.md","pending.md","projects.md","people.md"] },
  { id: "atena",    name: "Atena (CSO)",     icon: "🔍", color: "text-blue-400",   files: ["decisions.md","lessons.md","pending.md","projects.md","people.md"] },
  { id: "hefesto",  name: "Hefesto (CTO)",   icon: "⚒️", color: "text-orange-400", files: ["decisions.md","lessons.md","pending.md","projects.md","people.md"] },
  { id: "apollo",   name: "Apollo (CCO)",    icon: "🎭", color: "text-purple-400", files: ["decisions.md","lessons.md","pending.md","projects.md","people.md"] },
  { id: "afrodite", name: "Afrodite (CMO)",  icon: "💄", color: "text-pink-400",   files: ["decisions.md","lessons.md","pending.md","projects.md","people.md"] },
  { id: "hera",     name: "Hera (COO)",      icon: "⚙️", color: "text-emerald-400",files: ["decisions.md","lessons.md","pending.md","projects.md","people.md"] },
  { id: "ares",     name: "Ares (CQO)",      icon: "⚔️", color: "text-red-400",    files: ["decisions.md","lessons.md","pending.md","projects.md","people.md"] },
  { id: "hestia",   name: "Héstia (CPA)",    icon: "🏠", color: "text-teal-400",   files: ["decisions.md","lessons.md","pending.md","projects.md","people.md"] },
];

export default function MemoryBrowserPage() {
  const [expanded, setExpanded] = useState<string | null>("shared");
  const [selected, setSelected] = useState<{ agent: string; file: string } | null>(null);
  const [content, setContent] = useState<string>("");
  const [exists, setExists] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const loadFile = async (agent: string, file: string) => {
    setSelected({ agent, file });
    setEditing(false);
    setSaveStatus("idle");
    setLoading(true);
    setContent("");
    setExists(true);
    try {
      const res = await fetch(`/api/memory?agent=${agent}&file=${encodeURIComponent(file)}`);
      const data = await res.json();
      if (data.exists === false) {
        setExists(false);
        setContent("");
      } else {
        setExists(true);
        setContent(data.content || "");
      }
    } catch {
      setExists(false);
      setContent("");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    setEditContent(content);
    setEditing(true);
    setSaveStatus("idle");
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveStatus("idle");
  };

  const saveFile = async () => {
    if (!selected) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: selected.agent, file: selected.file, content: editContent }),
      });
      const data = await res.json();
      if (data.ok) {
        setContent(editContent);
        setEditing(false);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  };

  return (
    <div className="flex h-full min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="w-64 min-w-[220px] border-r border-zinc-800 flex flex-col overflow-y-auto">
        <div className="px-4 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-widest">Memory Browser</h2>
          <p className="text-xs text-zinc-500 mt-1">Arquivos de memória dos agentes</p>
        </div>
        <nav className="flex-1 py-2">
          {AGENTS.map((agent) => (
            <div key={agent.id}>
              <button
                onClick={() => setExpanded(expanded === agent.id ? null : agent.id)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-zinc-900 transition-colors text-left"
              >
                <span className="text-base">{agent.icon}</span>
                <span className={`flex-1 font-medium ${agent.color}`}>{agent.name}</span>
                <span className="text-zinc-600 text-xs">{expanded === agent.id ? "▲" : "▼"}</span>
              </button>
              {expanded === agent.id && (
                <div className="bg-zinc-950">
                  {agent.files.map((file) => {
                    const isActive = selected?.agent === agent.id && selected?.file === file;
                    return (
                      <button
                        key={file}
                        onClick={() => loadFile(agent.id, file)}
                        className={`w-full text-left px-8 py-2 text-xs transition-colors ${
                          isActive
                            ? "bg-zinc-800 text-[#D4AF37] border-l-2 border-[#D4AF37]"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                        }`}
                      >
                        📄 {file}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-zinc-600">
              <div className="text-5xl mb-4">🧠</div>
              <p className="text-lg font-medium text-zinc-500">Selecione um arquivo para visualizar</p>
              <p className="text-sm text-zinc-700 mt-1">Escolha um agente e arquivo na sidebar</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
              <div>
                <h1 className="text-sm font-semibold text-white">
                  {AGENTS.find(a => a.id === selected.agent)?.icon}{" "}
                  {AGENTS.find(a => a.id === selected.agent)?.name}
                  <span className="text-zinc-500 ml-2">/</span>
                  <span className="text-[#D4AF37] ml-2">{selected.file}</span>
                </h1>
                {saveStatus === "saved" && (
                  <p className="text-xs text-emerald-400 mt-1">✓ Arquivo salvo com sucesso</p>
                )}
                {saveStatus === "error" && (
                  <p className="text-xs text-red-400 mt-1">✗ Erro ao salvar</p>
                )}
              </div>
              <div className="flex gap-2">
                {!editing ? (
                  <button
                    onClick={startEdit}
                    disabled={loading || !exists}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded transition-colors disabled:opacity-40"
                  >
                    ✏️ Editar
                  </button>
                ) : (
                  <>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded transition-colors"
                    >
                      ✕ Cancelar
                    </button>
                    <button
                      onClick={saveFile}
                      disabled={saveStatus === "saving"}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#D4AF37] hover:bg-yellow-500 text-black font-medium rounded transition-colors disabled:opacity-60"
                    >
                      {saveStatus === "saving" ? "⏳ Salvando..." : "💾 Salvar"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-6">
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-4 bg-zinc-800 rounded w-1/2" />
                  <div className="h-4 bg-zinc-800 rounded w-5/6" />
                  <div className="h-4 bg-zinc-800 rounded w-2/3" />
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                </div>
              ) : !exists ? (
                <div className="flex flex-col items-center justify-center h-40 text-zinc-600">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-base font-medium text-zinc-500">Arquivo não encontrado</p>
                  <p className="text-sm text-zinc-700 mt-1">
                    Este agente ainda não possui o arquivo <span className="text-zinc-500">{selected.file}</span>
                  </p>
                </div>
              ) : editing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full min-h-[500px] bg-zinc-900 border border-zinc-700 rounded p-4 text-sm font-mono text-zinc-200 focus:outline-none focus:border-[#D4AF37] resize-none"
                  spellCheck={false}
                />
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-sm text-zinc-200 leading-relaxed">
                  {content || <span className="text-zinc-600 italic">(arquivo vazio)</span>}
                </pre>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
