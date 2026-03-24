"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, ExternalLink, Edit2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface KnowledgeItem {
  id: string;
  code: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  related_project_code?: string;
  agent_id?: string;
  importance: string;
  created_at: string;
  updated_at: string;
}

const CATEGORY_STYLES: Record<string, string> = {
  credencial:   "bg-red-500/30 text-red-300 border-red-500/30",
  decisão:      "bg-blue-500/30 text-blue-300 border-blue-500/30",
  projeto:      "bg-[#D4AF37]/30 text-[#D4AF37] border-[#D4AF37]/30",
  processo:     "bg-green-500/30 text-green-300 border-green-500/30",
  configuração: "bg-purple-500/30 text-purple-300 border-purple-500/30",
  contato:      "bg-pink-500/30 text-pink-300 border-pink-500/30",
  fato:         "bg-gray-500/30 text-gray-300 border-gray-500/30",
};

const IMPORTANCE_STYLES: Record<string, string> = {
  crítico: "border-red-500 text-red-400 animate-pulse",
  alto:    "border-orange-500 text-orange-400",
  normal:  "border-gray-600 text-gray-400",
  baixo:   "border-gray-700 text-gray-500",
};

interface KnowledgeCardProps {
  item: KnowledgeItem;
  onEdit?: (item: KnowledgeItem) => void;
}

export default function KnowledgeCard({ item, onEdit }: KnowledgeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const preview = item.content.slice(0, 150);
  const hasMore = item.content.length > 150;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(item);
  };

  const timeAgo = formatDistanceToNow(new Date(item.updated_at || item.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const catStyle = CATEGORY_STYLES[item.category] ?? "bg-gray-500/30 text-gray-300 border-gray-500/30";
  const impStyle = IMPORTANCE_STYLES[item.importance] ?? "border-gray-600 text-gray-400";

  return (
    <div className="bg-[#111] border border-[#D4AF37]/10 rounded-xl p-4 flex flex-col gap-3 hover:border-[#D4AF37]/25 transition-all">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[#D4AF37] text-xs font-bold tracking-widest bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-2 py-0.5 rounded">
            {item.code}
          </span>
          <span className={`text-[11px] px-2 py-0.5 rounded border capitalize ${catStyle}`}>
            {item.category}
          </span>
          <span className={`text-[11px] px-2 py-0.5 rounded border font-medium capitalize ${impStyle}`}>
            {item.importance}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="text-[#F5F5F5]/30 hover:text-[#D4AF37] transition-colors"
              title="Editar"
            >
              <Edit2 size={14} />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="text-[#F5F5F5]/30 hover:text-[#D4AF37] transition-colors"
            title="Copiar conteúdo"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-[#F5F5F5] font-semibold text-sm leading-snug">{item.title}</h3>

      {/* Content */}
      <div
        className="text-[#F5F5F5]/60 text-xs leading-relaxed cursor-pointer"
        onClick={() => hasMore && setExpanded(!expanded)}
      >
        {expanded ? item.content : preview}
        {!expanded && hasMore && (
          <span className="text-[#D4AF37]/70 ml-1">…ver mais</span>
        )}
        {expanded && hasMore && (
          <span className="text-[#D4AF37]/70 ml-1 block mt-1">▲ recolher</span>
        )}
      </div>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#F5F5F5]/40 border border-white/8">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-white/5">
        <span className="text-[10px] text-[#F5F5F5]/25">{timeAgo}</span>
        {item.related_project_code && (
          <Link
            href={`/projects?code=${item.related_project_code}`}
            className="flex items-center gap-1 text-[10px] text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
          >
            {item.related_project_code}
            <ExternalLink size={10} />
          </Link>
        )}
      </div>
    </div>
  );
}
