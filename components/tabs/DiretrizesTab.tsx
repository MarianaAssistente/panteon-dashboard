"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Search, Target, PenTool, Instagram, Youtube, Film, TrendingUp, Layers, BookOpen } from "lucide-react";

/* ─── tipos ─────────────────────────────────── */
interface Diretriz {
  id: string;
  titulo: string;
  fonte: string;
  descricao: string;
  topicos: string[];
  tags: string[];
}

interface Modulo {
  id: string;
  label: string;
  icon: React.ReactNode;
  cor: string;
  count: number;
  resumo: string;
  driveFolder: string;
  diretrizes: Diretriz[];
}

/* ─── dados ──────────────────────────────────── */
const DRIVE_PATH = "STM Group/Olimpo/Materiais de Estudo/Curso VTSD/";

const MODULOS: Modulo[] = [
  {
    id: "estrategia",
    label: "Estratégia & Produto",
    icon: <Target size={14} />,
    cor: "#6366F1",
    count: 4,
    resumo: "Frameworks de concepção, escolha e posicionamento de produtos digitais baseados no VTSD 2.0.",
    driveFolder: "shared/knowledge/estrategia/",
    diretrizes: [
      {
        id: "VTSD-EST-01",
        titulo: "Escolha de Produto — As 4 Situações de Mercado",
        fonte: "VTSD 2.0 — Aula 01 (Leandro Ladeira)",
        descricao: "Matriz de decisão para escolher o produto certo com base no perfil do especialista, competências técnicas e análise de mercado.",
        topicos: [
          "Matriz de Análise em 3 Dimensões: Perfil, Competências e Mercado",
          "Situação 1: Especialista sem produto",
          "Situação 2: Profissional sem especialização definida",
          "Situação 3: Produto existente sem escalabilidade",
          "Situação 4: Produto limitado a lançamentos",
          "Desconstrução de mitos: Lançamento vs Perpétuo",
        ],
        tags: ["produto", "posicionamento", "mercado", "vtsd"],
      },
      {
        id: "VTSD-EST-02",
        titulo: "Framework Completo — Concepção e Criação de Produtos",
        fonte: "VTSD 2.0 — Unidades 1 e 2 (Leandro Ladeira, Vitor Albuquerque, Ruy Guimarães)",
        descricao: "10 frameworks práticos cobrindo todo o processo de criação de produto digital: do QFD ao lançamento.",
        topicos: [
          "Framework 1: As 4 Situações de Mercado",
          "Framework 2: QFD (Quadro-Furadeira-Decorado)",
          "Framework 3: Precificação Estratégica por formato",
          "Framework 4: Matriz de Decisão por Formato (e-book, curso, mentoria)",
          "Framework 5: 5 Passos para Criar um Curso",
          "Framework 6: Identidade do Consumidor (segmentação)",
          "Framework 7: Identidade do Comunicador (posicionamento pessoal)",
          "Framework 8: Produto Perpétuo x Lançamento",
          "Framework 9: Esteira de Produtos (hierarquia)",
          "Framework 10: Técnica da Decisão Rápida (4 passos)",
        ],
        tags: ["frameworks", "qfd", "precificação", "esteira", "vtsd"],
      },
      {
        id: "VTSD-EST-03",
        titulo: "Diretrizes de Produto — STM Group",
        fonte: "VTSD 2.0 + Adaptação interna Panteão",
        descricao: "Regras obrigatórias para qualquer agente que for criar, ideacionar ou posicionar um produto digital da STM Group.",
        topicos: [
          "Checklist pré-produto (3 perguntas obrigatórias)",
          "Critérios de go/no-go para novo produto",
          "Taxonomia de produtos por vertical (STM Capital, Digital, Health, Consultancy)",
          "Regra de stacking: produto principal + order bump + upsell",
          "Prazo máximo de concepção: 7 dias",
        ],
        tags: ["processo", "stm", "checklist", "produto"],
      },
      {
        id: "VTSD-EST-04",
        titulo: "Diretrizes — Fluxos de Venda de Produtos Digitais",
        fonte: "VTSD 2.0 + Best practices de mercado",
        descricao: "Taxonomia completa dos 5 níveis de complexidade de fluxo e 10 tipos de fluxo detalhados.",
        topicos: [
          "5 níveis de complexidade: Direto → Sofisticado",
          "10 tipos: Conversão direta, Remarketing, Pré-checkout, Pico aberto/fechado/direto",
          "Upsell, Downsell, Order bump, Assinatura, SaaS, High ticket",
          "Regras de decisão por agente do Panteão",
          "Métricas de referência e KPIs por tipo de fluxo",
          "Template de decisão rápida",
        ],
        tags: ["funil", "vendas", "conversão", "fluxo"],
      },
    ],
  },
  {
    id: "copy",
    label: "Copywriting",
    icon: <PenTool size={14} />,
    cor: "#EC4899",
    count: 1,
    resumo: "Diretrizes completas de copywriting para todos os formatos de comunicação da STM Group.",
    driveFolder: "shared/knowledge/copy/",
    diretrizes: [
      {
        id: "VTSD-COPY-01",
        titulo: "Diretrizes de Copywriting — Apollo (CCO)",
        fonte: "VTSD 2.0 — Leandro Ladeira, Vitor Albuquerque, Ruy Guimarães",
        descricao: "Manual completo de copy para Apollo: gatilhos mentais, estruturas de VSL, email, páginas de vendas e scripts de conteúdo.",
        topicos: [
          "Estrutura AIDA e variações para infoprodutos",
          "12 gatilhos mentais mais eficazes por contexto",
          "Script VSL: abertura, problema, solução, prova, oferta, CTA",
          "Copy para página de vendas (above the fold, provas, garantia)",
          "Email marketing: sequência de boas-vindas + abandono",
          "Copy para anúncios Meta e Google (headlines, descrições)",
          "Tom de voz por vertical da STM Group",
          "Proibições: o que nunca escrever",
        ],
        tags: ["copy", "vsl", "email", "anúncio", "apollo"],
      },
    ],
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: <Instagram size={14} />,
    cor: "#F59E0B",
    count: 5,
    resumo: "Sistema completo de conteúdo para Instagram: fundamentos, Reels, Lives, Stories e engajamento.",
    driveFolder: "shared/knowledge/conteudo-instagram-youtube/instagram/",
    diretrizes: [
      {
        id: "VTSD-IG-01",
        titulo: "Fundamentos do Instagram para Negócios",
        fonte: "VTSD 2.0 — Aula 01 (Leandro Ladeira)",
        descricao: "Base estratégica para usar o Instagram como canal de aquisição e relacionamento com o mercado digital.",
        topicos: [
          "Lógica do perfil profissional vs. perfil de vendas",
          "Bio: fórmula de posicionamento em 3 linhas",
          "Destaque estratégico: o que salvar e por quê",
          "Frequência mínima por formato",
          "Métricas que realmente importam (não vaidades)",
        ],
        tags: ["instagram", "perfil", "bio", "fundamentos"],
      },
      {
        id: "VTSD-IG-02",
        titulo: "Reels — Sistema Completo de 7 Categorias",
        fonte: "VTSD 2.0 — Aulas 06–11 e 15 (Leandro Ladeira)",
        descricao: "Framework para criar Reels de alto desempenho em 7 categorias: do awareness ao remarketing.",
        topicos: [
          "Categoria 1: Educação (autoridade)",
          "Categoria 2: Bastidores (conexão)",
          "Categoria 3: Prova social (conversão)",
          "Categoria 4: Entretenimento (alcance)",
          "Categoria 5: Opinião polêmica (engajamento)",
          "Categoria 6: Trend/desafio (viralidade)",
          "Categoria 7: Produto/oferta (vendas)",
          "Estrutura de hook nos primeiros 3 segundos",
          "Proporção semanal recomendada",
        ],
        tags: ["reels", "instagram", "conteúdo", "hook"],
      },
      {
        id: "VTSD-IG-03",
        titulo: "Instagram Lives — 4 Categorias + Estrutura",
        fonte: "VTSD 2.0 — Aulas 02–05 (Leandro Ladeira)",
        descricao: "Como usar Lives de forma estratégica para aquecer audiência, gerar leads e vender.",
        topicos: [
          "Live 1: Educacional (gera autoridade + salva nos destaques)",
          "Live 2: Bastidores (gera proximidade)",
          "Live 3: Q&A (qualifica e elimina objeções)",
          "Live 4: Pitch / abertura de carrinho",
          "Roteiro de live: abertura, desenvolvimento, CTA",
          "Quando e com que frequência fazer",
        ],
        tags: ["lives", "instagram", "pitch", "vendas"],
      },
      {
        id: "VTSD-IG-04",
        titulo: "Instagram Stories — Conversão e Engajamento",
        fonte: "VTSD 2.0 — Aula 14 (Leandro Ladeira)",
        descricao: "Framework para usar Stories como canal de conversão diária sem parecer vendedor.",
        topicos: [
          "Sequência narrativa de Stories (3 a 5 frames)",
          "Stories de conversão: problema → solução → oferta",
          "Stories de engajamento: caixinha de perguntas, enquetes",
          "Stories de bastidores: humanização da marca",
          "Sticker link: quando e como usar",
          "Frequência ideal: 3–7 Stories/dia",
        ],
        tags: ["stories", "instagram", "engajamento", "conversão"],
      },
      {
        id: "VTSD-IG-05",
        titulo: "Linha Editorial e Engajamento no Instagram",
        fonte: "VTSD 2.0 — Aula 13 (Leandro Ladeira)",
        descricao: "Como construir uma linha editorial coesa que gera audiência qualificada e prepara para vendas.",
        topicos: [
          "Pilares de conteúdo: educação, entretenimento, inspiração, vendas",
          "Proporção recomendada por pilar",
          "Calendário editorial semanal",
          "Consistência vs. viralidade: onde focar",
          "Como adaptar conteúdo evergreen para cada formato",
        ],
        tags: ["editorial", "instagram", "pilares", "planejamento"],
      },
    ],
  },
  {
    id: "youtube",
    label: "YouTube",
    icon: <Youtube size={14} />,
    cor: "#EF4444",
    count: 4,
    resumo: "Estratégia completa para YouTube: algoritmo, SEO, linha editorial e monetização.",
    driveFolder: "shared/knowledge/conteudo-instagram-youtube/youtube/",
    diretrizes: [
      {
        id: "VTSD-YT-01",
        titulo: "Fundamentos do YouTube para Negócios",
        fonte: "VTSD 2.0 — Aula 12 (Leandro Ladeira)",
        descricao: "Por que e como usar o YouTube como canal de aquisição de longo prazo para infoprodutos.",
        topicos: [
          "YouTube vs. Instagram: quando priorizar cada um",
          "Tipos de conteúdo que performam no YouTube",
          "Canal como ativo: tráfego orgânico infinito",
          "Configuração técnica do canal para negócios",
          "Frequência mínima para o algoritmo",
        ],
        tags: ["youtube", "fundamentos", "orgânico"],
      },
      {
        id: "VTSD-YT-02",
        titulo: "SEO para YouTube — Guia Passo a Passo",
        fonte: "VTSD 2.0 — Aula 16 (Leandro Ladeira)",
        descricao: "Como rankear no YouTube e no Google usando as técnicas corretas de SEO para vídeos.",
        topicos: [
          "Pesquisa de palavras-chave (ferramentas gratuitas e pagas)",
          "Título: fórmula de SEO + curiosidade",
          "Descrição: estrutura dos primeiros 2 parágrafos",
          "Tags, chapters e closed captions",
          "Thumbnail: fórmula de CTR alto",
          "Playlist como estratégia de SEO",
        ],
        tags: ["seo", "youtube", "ranking", "thumbnail"],
      },
      {
        id: "VTSD-YT-03",
        titulo: "Algoritmo de Recomendação do YouTube",
        fonte: "VTSD 2.0 — Aula 17 (Leandro Ladeira)",
        descricao: "Como o algoritmo decide quem ver seu vídeo e como otimizar para máxima distribuição.",
        topicos: [
          "CTR (Click Through Rate): meta mínima e como melhorar",
          "Watch Time: por que é o principal indicador",
          "Sessão do espectador: o que o algoritmo premia",
          "Impressões vs. alcance: diferença prática",
          "Como usar o YouTube Analytics para tomar decisões",
        ],
        tags: ["algoritmo", "youtube", "watch-time", "ctr"],
      },
      {
        id: "VTSD-YT-04",
        titulo: "Linha Editorial no YouTube",
        fonte: "VTSD 2.0 — Aulas 13 e 18 (Leandro Ladeira)",
        descricao: "Como planejar uma linha editorial de YouTube que converte espectadores em compradores.",
        topicos: [
          "3 tipos de vídeo: Topo, Meio e Fundo de funil",
          "Cadência de publicação por fase do negócio",
          "Vídeos evergreen vs. trending: proporção ideal",
          "Call to Action no vídeo: onde e como inserir",
          "Integração YouTube + Instagram + Tráfego Pago",
        ],
        tags: ["editorial", "youtube", "funil", "planejamento"],
      },
    ],
  },
  {
    id: "templates",
    label: "Templates & Conteúdo",
    icon: <Layers size={14} />,
    cor: "#10B981",
    count: 3,
    resumo: "Roteiros, hooks e CTAs prontos para usar em qualquer formato de conteúdo.",
    driveFolder: "shared/knowledge/conteudo-instagram-youtube/templates/",
    diretrizes: [
      {
        id: "VTSD-TPL-01",
        titulo: "Roteiros de Conteúdo — Templates Prontos",
        fonte: "VTSD 2.0 (Leandro Ladeira)",
        descricao: "Biblioteca de roteiros estruturados para Reels, YouTube, Lives e Stories.",
        topicos: [
          "Roteiro educacional curto (60s): problema → insight → solução",
          "Roteiro de autoridade: história → prova → convite",
          "Roteiro de venda: dor → agitação → solução → oferta",
          "Script de Live de vendas (90 min)",
          "Template de YouTube longo (10–20 min)",
        ],
        tags: ["roteiro", "script", "template"],
      },
      {
        id: "VTSD-TPL-02",
        titulo: "Hooks — Biblioteca de Abertura",
        fonte: "VTSD 2.0 (Leandro Ladeira)",
        descricao: "Coleção de hooks validados para os primeiros 3 segundos de Reels e YouTube.",
        topicos: [
          "Hook de curiosidade: 'O que ninguém te conta sobre…'",
          "Hook de erro comum: 'Você está fazendo X errado se…'",
          "Hook de resultado: 'Como eu fiz X sem Y'",
          "Hook de polêmica: 'Discordo totalmente de…'",
          "Hook de prova: 'Fiz X em Y dias e foi assim:'",
          "30+ variações catalogadas por formato",
        ],
        tags: ["hook", "abertura", "reels", "youtube"],
      },
      {
        id: "VTSD-TPL-03",
        titulo: "CTAs — Calls to Action por Objetivo",
        fonte: "VTSD 2.0 (Leandro Ladeira)",
        descricao: "Biblioteca de CTAs organizados por objetivo: engajamento, lead, venda e indicação.",
        topicos: [
          "CTA de engajamento: comentário, compartilhamento, salvar",
          "CTA de lead: bio link, direct, lista de espera",
          "CTA de venda: link de pagamento, checkout direto",
          "CTA de indicação: programa de afiliados",
          "Como e quando usar cada tipo de CTA",
        ],
        tags: ["cta", "conversão", "engajamento"],
      },
    ],
  },
  {
    id: "trafego",
    label: "Tráfego Pago",
    icon: <TrendingUp size={14} />,
    cor: "#8B5CF6",
    count: 1,
    resumo: "Guia completo Meta Ads + Google Ads para infoprodutos — campanhas perpétuas e picos de lançamento.",
    driveFolder: "shared/knowledge/trafego-pago/",
    diretrizes: [
      {
        id: "VTSD-TRAF-01",
        titulo: "Guia Completo de Tráfego Pago — Meta + Google Ads",
        fonte: "VTSD 2.0 — Ultra Black Friday (Leandro Ladeira)",
        descricao: "Manual operacional completo para campanhas de performance em Meta Ads e Google Ads para infoprodutos.",
        topicos: [
          "Meta Ads: Estrutura de campanha (nomenclatura padrão VTSD)",
          "Pixel: instalação, eventos padrão e customizados",
          "Públicos: frios, mornos, quentes e lookalike",
          "Campanhas de Descoberta, Relacionamento, Conversão e Remarketing",
          "Campanha de Pico: estrutura para lançamentos",
          "Google Ads: Search (institucional, dor, remarketing)",
          "Google Ads: YouTube In-Stream + Geração de Demanda + PMAX",
          "Métricas, colunas e regras de otimização",
          "Checklists completos: Meta + Google + Pico de Vendas",
          "Nomes de conjuntos VTSD: CV-QUENTE, RMK-SUPERQUENTE, DESK-FRIO",
        ],
        tags: ["meta-ads", "google-ads", "trafego-pago", "performance", "lançamento"],
      },
    ],
  },
];

/* ─── componente principal ───────────────────── */
export default function DiretrizesTab() {
  const [expandedModulo, setExpandedModulo] = useState<string | null>("estrategia");
  const [expandedDiretriz, setExpandedDiretriz] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const totalDiretrizes = MODULOS.reduce((acc, m) => acc + m.diretrizes.length, 0);
  const totalTopicos = MODULOS.reduce((acc, m) => acc + m.diretrizes.reduce((a, d) => a + d.topicos.length, 0), 0);

  const modulosFiltrados = MODULOS.map((m) => ({
    ...m,
    diretrizes: m.diretrizes.filter(
      (d) =>
        !busca ||
        d.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        d.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        d.topicos.some((t) => t.toLowerCase().includes(busca.toLowerCase())) ||
        d.tags.some((t) => t.toLowerCase().includes(busca.toLowerCase()))
    ),
  })).filter((m) => !busca || m.diretrizes.length > 0);

  return (
    <div className="p-6">

      {/* Header info */}
      <div className="bg-[#111] border border-[#D4AF37]/10 rounded-2xl p-4 mb-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-[#F5F5F5]/60 leading-relaxed mb-2">
              Base de conhecimento extraída do curso <strong className="text-[#D4AF37]/80">VTSD 2.0</strong> — Leandro Ladeira, Vitor Albuquerque e Ruy Guimarães.
              Processada e estruturada pela Atena para uso operacional de todos os agentes do Panteão.
            </p>
            <div className="flex items-center gap-1.5 bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-lg px-2.5 py-1.5 w-fit">
              <BookOpen size={10} className="text-[#6366F1]" />
              <p className="text-[10px] font-mono text-[#6366F1]/80">📁 {DRIVE_PATH}</p>
              <a
                href="https://drive.google.com/drive/folders/1NP6tlbmiIeOaWB-Kk3q6l2qF6807V0sK"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1"
              >
                <ExternalLink size={9} className="text-[#6366F1]/60 hover:text-[#6366F1]" />
              </a>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="text-center">
              <p className="text-xl font-bold text-[#D4AF37]">{totalDiretrizes}</p>
              <p className="text-[10px] text-[#F5F5F5]/30">diretrizes</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#6366F1]">{totalTopicos}</p>
              <p className="text-[10px] text-[#F5F5F5]/30">tópicos</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#10B981]">{MODULOS.length}</p>
              <p className="text-[10px] text-[#F5F5F5]/30">módulos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="relative mb-5">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F5F5F5]/25" />
        <input
          type="text"
          placeholder="Buscar por título, tópico ou tag…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-[#111] border border-[#D4AF37]/10 rounded-xl text-sm text-[#F5F5F5]/70 placeholder-[#F5F5F5]/20 focus:outline-none focus:border-[#D4AF37]/30"
        />
      </div>

      {/* Módulos */}
      <div className="space-y-3">
        {modulosFiltrados.map((modulo) => {
          const isOpen = expandedModulo === modulo.id || !!busca;
          return (
            <div
              key={modulo.id}
              className="bg-[#111] border rounded-2xl overflow-hidden transition-all duration-200"
              style={{ borderColor: isOpen ? `${modulo.cor}30` : "rgba(212,175,55,0.08)" }}
            >
              {/* Cabeçalho do módulo */}
              <button
                className="w-full p-4 flex items-center gap-3 text-left"
                onClick={() => setExpandedModulo(isOpen && !busca ? null : modulo.id)}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${modulo.cor}18`, color: modulo.cor }}
                >
                  {modulo.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#F5F5F5]">{modulo.label}</h3>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                      style={{ backgroundColor: `${modulo.cor}15`, color: modulo.cor }}
                    >
                      {modulo.diretrizes.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#F5F5F5]/35 mt-0.5 truncate">{modulo.resumo}</p>
                </div>
                <span className="text-[#F5F5F5]/20 flex-shrink-0">
                  {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </span>
              </button>

              {/* Diretrizes do módulo */}
              {isOpen && modulo.diretrizes.length > 0 && (
                <div className="border-t px-4 pb-4 pt-3 space-y-2" style={{ borderColor: `${modulo.cor}12` }}>
                  {/* Path */}
                  <p className="text-[10px] font-mono text-[#F5F5F5]/20 mb-3">📁 {modulo.driveFolder}</p>

                  {modulo.diretrizes.map((d) => {
                    const isDExp = expandedDiretriz === d.id;
                    return (
                      <div
                        key={d.id}
                        className="rounded-xl border overflow-hidden transition-all"
                        style={{ borderColor: isDExp ? `${modulo.cor}25` : "rgba(245,245,245,0.05)" }}
                      >
                        <button
                          className="w-full px-3.5 py-3 flex items-start gap-3 text-left"
                          onClick={() => setExpandedDiretriz(isDExp ? null : d.id)}
                        >
                          <div
                            className="w-1 self-stretch rounded-full flex-shrink-0"
                            style={{ backgroundColor: modulo.cor }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-[10px] font-mono text-[#F5F5F5]/25">{d.id}</span>
                            </div>
                            <p className="text-[13px] font-semibold text-[#F5F5F5]/90">{d.titulo}</p>
                            <p className="text-[11px] text-[#F5F5F5]/35 mt-0.5">{d.fonte}</p>
                          </div>
                          <span className="text-[#F5F5F5]/20 flex-shrink-0 mt-1">
                            {isDExp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </span>
                        </button>

                        {isDExp && (
                          <div className="px-5 pb-4 pt-2 border-t space-y-3" style={{ borderColor: `${modulo.cor}10` }}>
                            <p className="text-[12px] text-[#F5F5F5]/55 leading-relaxed">{d.descricao}</p>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: `${modulo.cor}80` }}>
                                Tópicos cobertos
                              </p>
                              <ul className="space-y-1">
                                {d.topicos.map((t, i) => (
                                  <li key={i} className="flex items-start gap-2 text-[12px] text-[#F5F5F5]/50">
                                    <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: modulo.cor }} />
                                    {t}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {d.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded border"
                                  style={{ color: `${modulo.cor}70`, borderColor: `${modulo.cor}20`, backgroundColor: `${modulo.cor}08` }}
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
