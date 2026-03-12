"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Paperclip, X, Image as ImageIcon, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Attachment {
  name: string;
  type: string;
  dataUrl: string; // base64
  preview?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  timestamp: Date;
  pending?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá, Yuri. Sou a Mariana. Pode falar — texto, imagem ou arquivo.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const newAttachments: Attachment[] = [];
    for (const file of Array.from(files)) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      newAttachments.push({
        name: file.name,
        type: file.type,
        dataUrl,
        preview: file.type.startsWith("image/") ? dataUrl : undefined,
      });
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files = Array.from(items)
        .filter((i) => i.kind === "file")
        .map((i) => i.getAsFile())
        .filter(Boolean) as File[];
      if (files.length > 0) {
        handleFiles(files as unknown as FileList);
      }
    },
    [handleFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const buildApiMessages = (msgs: Message[], pendingAttachments: Attachment[]) => {
    const result: any[] = [];
    for (const m of msgs) {
      if (m.role === "assistant" && !m.pending) {
        result.push({ role: "assistant", content: m.content });
      } else if (m.role === "user") {
        const content: any[] = [];
        if (m.content) content.push({ type: "text", text: m.content });
        for (const att of m.attachments ?? []) {
          if (att.type.startsWith("image/")) {
            const base64 = att.dataUrl.split(",")[1];
            content.push({
              type: "image",
              source: { type: "base64", media_type: att.type, data: base64 },
            });
          }
        }
        result.push({ role: "user", content: content.length === 1 && content[0].type === "text" ? m.content : content });
      }
    }
    return result;
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if ((!text && attachments.length === 0) || loading) return;

    const userMsg: Message = {
      role: "user",
      content: text,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      timestamp: new Date(),
    };
    const assistantMsg: Message = {
      role: "assistant",
      content: "",
      pending: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setAttachments([]);
    setLoading(true);

    const allMessages = [...messages, userMsg];
    const apiMessages = buildApiMessages(allMessages, attachments);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              fullText += delta;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: fullText };
                return updated;
              });
            }
          } catch {}
        }
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], pending: false };
        return updated;
      });
    } catch (err: any) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: `Erro de conexão: ${err.message}`,
          pending: false,
        };
        return updated;
      });
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, attachments, loading, messages]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => {
    setMessages([{ role: "assistant", content: "Conversa reiniciada. O que precisa?", timestamp: new Date() }]);
    setAttachments([]);
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-0px)]"
      onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4AF37]/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-lg">👑</div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0A0A0A] animate-pulse" />
          </div>
          <div>
            <p className="font-semibold text-[#F5F5F5]">Mariana</p>
            <p className="text-xs text-[#F5F5F5]/30">CEO · STM Group · online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#F5F5F5]/20">{messages.length - 1} mensagens</span>
          <button onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-[#F5F5F5]/25 hover:text-red-400 transition-colors px-2 py-1 rounded-lg border border-transparent hover:border-red-400/20">
            <Trash2 size={12} /> Limpar
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1 ${
              msg.role === "assistant"
                ? "bg-[#D4AF37]/15 border border-[#D4AF37]/30"
                : "bg-[#F5F5F5]/5 border border-[#F5F5F5]/10"
            }`}>
              {msg.role === "assistant" ? "👑" : "🧑"}
            </div>

            <div className={`flex flex-col gap-1.5 max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {/* Attachments */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {msg.attachments.map((att, ai) => (
                    <div key={ai} className="rounded-xl overflow-hidden border border-[#D4AF37]/15">
                      {att.preview ? (
                        <img src={att.preview} alt={att.name}
                          className="max-w-[240px] max-h-[180px] object-cover rounded-xl" />
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1A]">
                          <FileText size={14} className="text-[#D4AF37]/50" />
                          <span className="text-xs text-[#F5F5F5]/60 max-w-[160px] truncate">{att.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Bubble */}
              {(msg.content || msg.pending) && (
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[#D4AF37]/15 border border-[#D4AF37]/20 text-[#F5F5F5]/90 rounded-tr-sm"
                    : "bg-[#1A1A1A] border border-[#D4AF37]/8 text-[#F5F5F5]/80 rounded-tl-sm"
                }`}>
                  {msg.content || (
                    <span className="flex items-center gap-1.5 text-[#F5F5F5]/30">
                      <Loader2 size={12} className="animate-spin" /> digitando...
                    </span>
                  )}
                  {msg.pending && msg.content && (
                    <span className="inline-block w-0.5 h-4 bg-[#D4AF37]/60 animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
              )}

              {/* Timestamp */}
              <span className="text-[10px] text-[#F5F5F5]/15 px-1">
                {mounted ? format(msg.timestamp, "HH:mm", { locale: ptBR }) : ""}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="px-6 pb-2 flex gap-2 flex-wrap flex-shrink-0">
          {attachments.map((att, i) => (
            <div key={i} className="relative group">
              {att.preview ? (
                <img src={att.preview} alt={att.name}
                  className="w-16 h-16 object-cover rounded-xl border border-[#D4AF37]/20" />
              ) : (
                <div className="w-16 h-16 rounded-xl border border-[#D4AF37]/20 bg-[#1A1A1A] flex flex-col items-center justify-center gap-1 p-1">
                  <FileText size={20} className="text-[#D4AF37]/50" />
                  <span className="text-[8px] text-[#F5F5F5]/40 truncate w-full text-center px-1">{att.name}</span>
                </div>
              )}
              <button onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={10} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="px-6 pb-6 flex-shrink-0">
        <div className="bg-[#111] border border-[#D4AF37]/15 rounded-2xl focus-within:border-[#D4AF37]/35 transition-colors overflow-hidden">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            onPaste={handlePaste}
            placeholder="Digite sua mensagem... (cole imagens diretamente)"
            rows={3}
            disabled={loading}
            className="w-full bg-transparent text-sm text-[#F5F5F5]/80 placeholder-[#F5F5F5]/20 resize-none focus:outline-none px-4 pt-4 pb-2"
          />
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1.5">
              <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.txt,.md,.json,.csv"
                className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-[#F5F5F5]/25 hover:text-[#D4AF37]/60 transition-colors px-2 py-1.5 rounded-lg hover:bg-[#D4AF37]/5">
                <Paperclip size={13} /> Arquivo
              </button>
              <button onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = "image/*"; fileInputRef.current.click(); fileInputRef.current.accept = "image/*,.pdf,.txt,.md,.json,.csv"; } }}
                className="flex items-center gap-1.5 text-xs text-[#F5F5F5]/25 hover:text-[#D4AF37]/60 transition-colors px-2 py-1.5 rounded-lg hover:bg-[#D4AF37]/5">
                <ImageIcon size={13} /> Imagem
              </button>
              <span className="text-[10px] text-[#F5F5F5]/10 ml-1">ou cole (Ctrl+V)</span>
            </div>
            <button onClick={send}
              disabled={(!input.trim() && attachments.length === 0) || loading}
              className="flex items-center gap-2 bg-[#D4AF37] disabled:bg-[#D4AF37]/20 text-[#0A0A0A] disabled:text-[#D4AF37]/40 px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-[#E5C84A]">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-[#F5F5F5]/10 text-center mt-2">
          Enter para enviar · Shift+Enter para nova linha · Arraste arquivos aqui
        </p>
      </div>
    </div>
  );
}
