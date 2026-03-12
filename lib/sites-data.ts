export type SiteStatus = "online" | "em_desenvolvimento" | "planejado" | "offline";
export type SiteVertical = "STM Capital" | "STM Digital" | "AgiSales" | "STM Group" | "Interno";

export interface SiteData {
  id: string;
  name: string;
  url: string;
  vertical: SiteVertical;
  status: SiteStatus;
  type: string;
  description: string;
  stack: string[];
  features: string[];
  responsible: string;
  repo?: string;
  notes?: string;
}

export const SITES_DATA: SiteData[] = [
  {
    id: "dashboard",
    name: "Dashboard do Panteão",
    url: "https://dashboard.stmgroup.com.br",
    vertical: "Interno",
    status: "online",
    type: "Painel Interno",
    description: "Central de gestão e monitoramento do Panteão do Olimpo. Exibe fila de tarefas, projetos, aprovações, organograma dos agentes, base de conhecimento, skills e lições aprendidas.",
    stack: ["Next.js 14", "Tailwind CSS", "Supabase", "Vercel"],
    features: [
      "Fila de tarefas com status em tempo real",
      "Organograma com perfil de cada agente",
      "Aprovações de entregas pelo Yuri",
      "Knowledge Base com busca full-text",
      "Skills do sistema documentadas",
      "Lições aprendidas e decisões arquiteturais",
      "Histórico de atividades",
    ],
    responsible: "hefesto",
    repo: "https://github.com/MarianaAssistente/panteon-dashboard",
    notes: "Único acesso: Yuri. Deploy automático via GitHub → Vercel.",
  },
  {
    id: "privacidade",
    name: "Política de Privacidade STM Capital",
    url: "https://privacidade.stmgroup.com.br",
    vertical: "STM Capital",
    status: "online",
    type: "Página Legal",
    description: "Política de privacidade da STM Capital, necessária para uso do Meta App (Instagram Business). Hospedada via GitHub Pages com domínio customizado.",
    stack: ["HTML estático", "GitHub Pages", "DNS customizado"],
    features: [
      "Política de privacidade gerada via TermsFeed",
      "Domínio customizado (privacidade.stmgroup.com.br)",
      "Necessária para aprovação do Meta App",
    ],
    responsible: "hefesto",
    repo: "https://github.com/MarianaAssistente/stmcapital-legal",
    notes: "URL original: marianaassistente.github.io/stmcapital-legal — também acessível pelo domínio customizado.",
  },
  {
    id: "contempla",
    name: "STM Contempla",
    url: "https://contempla.stmgroup.com.br",
    vertical: "STM Capital",
    status: "em_desenvolvimento",
    type: "MicroSaaS / App",
    description: "Simulador e plataforma de consórcio como estratégia de alavancagem patrimonial. Permite simular consórcios, calcular potencial de alavancagem e contratar planos. Integrado com Kiwify para pagamentos.",
    stack: ["Next.js 14", "Supabase", "Tailwind CSS", "Vercel", "Kiwify"],
    features: [
      "Simulador de consórcio com múltiplas calculadoras",
      "Cálculo de alavancagem patrimonial",
      "Planos: Free, Basic, Pro",
      "Integração Kiwify (webhook de pagamento)",
      "Geração de PDF do plano patrimonial",
      "Controle de simulações por plano",
    ],
    responsible: "hefesto",
    notes: "CAP-002. Em desenvolvimento ativo.",
  },
  {
    id: "agisales",
    name: "AgiSales MicroSaaS",
    url: "https://agisales.stmgroup.com.br",
    vertical: "AgiSales",
    status: "em_desenvolvimento",
    type: "SaaS / Sistema Interno",
    description: "Sistema de gestão de suporte e implantação para a AgiSales. Permite abertura de tickets, gestão de implantação de contratos PJ, controle de beneficiários e comunicação entre Admin, Sales Advisors e empresas clientes.",
    stack: ["Next.js", "Prisma", "PostgreSQL", "Tailwind CSS", "Vercel"],
    features: [
      "Tickets de suporte (implantação, sistema, acessos, faturamento)",
      "Gestão de implantação de contratos PJ",
      "Cadastro de beneficiários por empresa",
      "3 perfis: Admin (Yuri), Sales Advisor, Empresa Cliente",
      "Código de acesso temporário para empresas",
      "Notificações por email",
    ],
    responsible: "hefesto",
    repo: "https://github.com/MarianaAssistente/agisales-microsaas",
    notes: "AGI-001. Deploy pendente — código pronto, aguarda configuração de domínio e banco.",
  },
  {
    id: "instagram-stm-capital",
    name: "Instagram @stm.capital",
    url: "https://instagram.com/stm.capital",
    vertical: "STM Capital",
    status: "online",
    type: "Rede Social",
    description: "Perfil Instagram Business da STM Capital. Automatizado com publicações 4x por semana (seg, qua, sex, dom) via Meta Graph API. Conteúdo focado em planejamento patrimonial, consórcio e investimentos.",
    stack: ["Meta Graph API", "Imgur CDN", "Shell Scripts", "Cron Jobs"],
    features: [
      "Publicação automatizada 4x/semana",
      "Imagens geradas com Gemini Imagen 4",
      "Legendas com hashtags por Afrodite/Apollo",
      "Crons: seg 08h, qua 12h, sex 18h, dom 10h (BRT)",
      "Instagram Business Account ID: 17841461260950333",
    ],
    responsible: "afrodite",
    notes: "CAP-001. Token permanente configurado. Semana 1 publicada. Semana 2 pendente.",
  },
  {
    id: "instagram-panteon",
    name: "Instagram @panteon.digital",
    url: "https://instagram.com/panteon.digital",
    vertical: "STM Digital",
    status: "em_desenvolvimento",
    type: "Rede Social",
    description: "Canal do Panteão Digital no Instagram. Focado em conteúdo educativo sobre IA, agentes autônomos e automação. Canal de distribuição do e-book e futuros produtos digitais.",
    stack: ["Meta Graph API", "Hedra Character-3", "ElevenLabs TTS"],
    features: [
      "Conteúdo: IA, agentes, automação",
      "Vídeos com avatar Mariana (Hedra Character-3)",
      "Identidade visual criada por Afrodite",
      "CTA: e-book Panteão Digital",
    ],
    responsible: "afrodite",
    notes: "TSK-021 concluído (perfil criado). Conteúdo e automatização em planejamento.",
  },
  {
    id: "facebook-stm-capital",
    name: "Página Facebook STM Capital",
    url: "https://facebook.com/profile.php?id=61583775632785",
    vertical: "STM Capital",
    status: "online",
    type: "Rede Social",
    description: "Página profissional da STM Capital no Facebook. Vinculada ao Instagram Business para uso da Meta Graph API. Botão de ação configurado para WhatsApp.",
    stack: ["Meta Business Suite"],
    features: [
      "Categoria: Serviço financeiro",
      "Botão de ação: WhatsApp",
      "Vinculada ao Meta App ID: 1993275764902945",
      "Necessária para API do Instagram",
    ],
    responsible: "afrodite",
    notes: "Page ID: 61583775632785. Criada em 2026-03-08.",
  },
];

export const SITE_STATUS_CONFIG: Record<SiteStatus, { label: string; color: string; dot: string }> = {
  online:           { label: "Online",           color: "#22C55E", dot: "bg-green-400" },
  em_desenvolvimento: { label: "Em desenvolvimento", color: "#F59E0B", dot: "bg-amber-400" },
  planejado:        { label: "Planejado",        color: "#7B9EA8", dot: "bg-blue-400" },
  offline:          { label: "Offline",          color: "#EF4444", dot: "bg-red-400" },
};

export const VERTICAL_COLOR: Record<SiteVertical, string> = {
  "STM Capital":   "#D4AF37",
  "STM Digital":   "#9B7EC8",
  "AgiSales":      "#06B6D4",
  "STM Group":     "#F5F5F5",
  "Interno":       "#8BA888",
};
