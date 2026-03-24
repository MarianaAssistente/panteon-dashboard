"use client";
import { useState, useRef, useEffect } from "react";

const commands = [
  { id: "status",       label: "Status OpenClaw",   icon: "🔄" },
  { id: "crons",        label: "Crons Ativos",       icon: "📅" },
  { id: "logs-relay",   label: "Log Relay",          icon: "📋" },
  { id: "logs-metrics", label: "Log Métricas",       icon: "📊" },
  { id: "ps-agents",    label: "Processos Agentes",  icon: "🤖" },
  { id: "disk",         label: "Uso de Disco",       icon: "💾" },
  { id: "memory",       label: "Memória",            icon: "🧠" },
  { id: "uptime",       label: "Uptime",             icon: "⏱️" },
  { id: "network",      label: "Portas Ativas",      icon: "🌐" },
  { id: "log-today",    label: "Logs de Hoje",       icon: "📄" },
];

export default function TerminalPage() {
  const [output, setOutput] = useState<string>("");
  const [currentCmd, setCurrentCmd] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [timestamp, setTimestamp] = useState<string>("");
  const [activeId, setActiveId] = useState<string>("");
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  async function runCommand(cmd: string, label: string) {
    setLoading(true);
    setCurrentCmd(label);
    setActiveId(cmd);
    setOutput("");
    try {
      const res = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      setOutput(data.output || data.error || "sem saída");
      setTimestamp(data.timestamp || new Date().toISOString());
    } catch {
      setOutput("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  function formatTimestamp(ts: string) {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleString("pt-BR", { timeZone: "America/Recife" });
    } catch {
      return ts;
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold text-[#D4AF37]">Terminal</h1>
        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold border border-[#D4AF37]/40 text-[#D4AF37] bg-[#D4AF37]/10 tracking-widest">
          READ-ONLY
        </span>
      </div>

      <div className="flex gap-6 h-[calc(100vh-140px)]">
        {/* Left panel — quick-action buttons */}
        <div className="w-56 flex-shrink-0 flex flex-col gap-2">
          <p className="text-xs text-[#D4AF37]/50 uppercase tracking-widest mb-1 font-mono">Comandos</p>
          {commands.map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => runCommand(cmd.id, cmd.label)}
              disabled={loading}
              className={`flex items-center gap-2 px-3 py-2.5 rounded text-sm font-mono text-left transition-all border
                ${activeId === cmd.id
                  ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"
                  : "border-[#D4AF37]/15 bg-[#0d0d0d] text-gray-300 hover:border-[#D4AF37]/40 hover:text-white"
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="text-base leading-none">{cmd.icon}</span>
              <span className="truncate">{cmd.label}</span>
            </button>
          ))}
        </div>

        {/* Right panel — output */}
        <div className="flex-1 flex flex-col rounded-lg border border-[#D4AF37]/20 overflow-hidden bg-[#0d0d0d]">
          {/* Output header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#D4AF37]/15 bg-[#111]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
              <span className="font-mono text-xs text-gray-400">
                {currentCmd ? `$ ${currentCmd}` : "Selecione um comando →"}
              </span>
              {loading && (
                <span className="ml-2 inline-block w-3 h-3 border-2 border-[#D4AF37]/40 border-t-[#D4AF37] rounded-full animate-spin" />
              )}
            </div>
            <div className="flex items-center gap-3">
              {timestamp && (
                <span className="font-mono text-[10px] text-gray-600">{formatTimestamp(timestamp)}</span>
              )}
              <button
                onClick={() => { setOutput(""); setCurrentCmd(""); setTimestamp(""); setActiveId(""); }}
                className="text-xs font-mono text-[#D4AF37]/50 hover:text-[#D4AF37] transition-colors px-2 py-0.5 rounded border border-[#D4AF37]/15 hover:border-[#D4AF37]/40"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Output body */}
          <div
            ref={outputRef}
            className="flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed"
          >
            {loading ? (
              <div className="flex items-center gap-2 text-[#D4AF37]/60">
                <span className="inline-block w-4 h-4 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
                <span>Executando comando...</span>
              </div>
            ) : output ? (
              <pre className="whitespace-pre-wrap text-[#22c55e] break-all">{output}</pre>
            ) : (
              <div className="text-gray-600 text-xs">
                <span className="text-[#D4AF37]/30">// </span>Nenhum comando executado. Clique em um botão à esquerda.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
