"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

const AGENT_EMOJI: Record<string, string> = {
  mariana: "👑", atena: "🦉", hefesto: "⚒️", apollo: "🎨",
  afrodite: "✨", hera: "🏛️", ares: "⚔️", hestia: "🕯️",
};

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Não mostrar na página de Chat dedicada
  if (pathname === "/chat") return null;
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá, Yuri. Sou a Mariana. O que precisa?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    const userMsg: Message = { role: "user", content: text };
    const assistantMsg: Message = { role: "assistant", content: "", pending: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setLoading(true);

    // Build history for context
    const history = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              fullText += delta;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: fullText,
                  pending: true,
                };
                return updated;
              });
            }
          } catch {
            // chunk incompleto, ignorar
          }
        }
      }

      // Finalizar
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: fullText, pending: false };
        return updated;
      });
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Erro ao conectar com o gateway. Tente novamente.",
          pending: false,
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Botão flutuante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#D4AF37] hover:bg-[#E5C84A] shadow-2xl shadow-[#D4AF37]/30 flex items-center justify-center transition-all duration-200 hover:scale-110 z-50 group"
        >
          <MessageCircle size={22} className="text-[#0A0A0A]" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0A0A0A] animate-pulse" />
        </button>
      )}

      {/* Painel do chat */}
      {open && (
        <div className="fixed bottom-6 right-6 w-[380px] h-[520px] bg-[#0D0D0D] border border-[#D4AF37]/20 rounded-2xl shadow-2xl shadow-black/50 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#D4AF37]/10 bg-[#111]">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-sm">
                👑
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#111] animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#F5F5F5]">Mariana</p>
              <p className="text-[10px] text-[#F5F5F5]/30">CEO · STM Group</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-green-400/70 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                online
              </span>
              <button onClick={() => setOpen(false)} className="text-[#F5F5F5]/30 hover:text-[#F5F5F5] transition-colors p-1">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Color bar */}
          <div className="h-0.5 bg-gradient-to-r from-[#D4AF37] via-[#F5D06F] to-[#D4AF37]" />

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <span className="text-base mr-2 mt-0.5 flex-shrink-0">👑</span>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#D4AF37]/15 border border-[#D4AF37]/20 text-[#F5F5F5]/90 rounded-tr-sm"
                      : "bg-[#1A1A1A] border border-[#D4AF37]/8 text-[#F5F5F5]/80 rounded-tl-sm"
                  }`}
                >
                  {msg.content || (msg.pending && (
                    <span className="flex items-center gap-1 text-[#F5F5F5]/30">
                      <Loader2 size={12} className="animate-spin" />
                      digitando...
                    </span>
                  ))}
                  {msg.pending && msg.content && (
                    <span className="inline-block w-1 h-3.5 bg-[#D4AF37]/60 animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[#D4AF37]/10 bg-[#111]">
            <div className="flex items-end gap-2 bg-[#1A1A1A] border border-[#D4AF37]/15 rounded-xl px-3 py-2 focus-within:border-[#D4AF37]/40 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Digite sua mensagem..."
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent text-sm text-[#F5F5F5]/80 placeholder-[#F5F5F5]/20 resize-none focus:outline-none max-h-24 overflow-y-auto"
                style={{ lineHeight: "1.5" }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="w-7 h-7 rounded-lg bg-[#D4AF37] disabled:bg-[#D4AF37]/20 flex items-center justify-center transition-colors flex-shrink-0 hover:bg-[#E5C84A]"
              >
                {loading
                  ? <Loader2 size={12} className="text-[#0A0A0A] animate-spin" />
                  : <Send size={12} className="text-[#0A0A0A] disabled:text-[#D4AF37]/40" />
                }
              </button>
            </div>
            <p className="text-[9px] text-[#F5F5F5]/15 text-center mt-1.5">
              Enter para enviar · Shift+Enter para nova linha
            </p>
          </div>
        </div>
      )}
    </>
  );
}
