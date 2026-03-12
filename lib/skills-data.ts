export interface SkillData {
  id: string;
  name: string;
  emoji: string;
  category: "desenvolvimento" | "produtividade" | "conteudo" | "infraestrutura" | "dados" | "comunicacao";
  description: string;
  whenToUse: string[];
  whenNotToUse?: string[];
  howWeUse: string;
  agents: string[];
  requires?: string;
  homepage?: string;
  color: string;
}

export const SKILLS_DATA: SkillData[] = [
  {
    id: "coding-agent",
    name: "Coding Agent",
    emoji: "🤖",
    category: "desenvolvimento",
    description: "Delega tarefas de código para agentes especializados (Codex, Claude Code, Pi) rodando em background via processo. Permite que o agente principal continue trabalhando enquanto o código é gerado em paralelo.",
    whenToUse: [
      "Construir ou criar novas features e apps",
      "Revisar Pull Requests (spawna em pasta temporária)",
      "Refatorar grandes bases de código",
      "Tarefas iterativas de código que precisam explorar arquivos",
    ],
    whenNotToUse: [
      "Fixes simples de uma linha (use edit direto)",
      "Apenas leitura de código (use read tool)",
      "Qualquer trabalho dentro do workspace ~/clawd",
    ],
    howWeUse: "Hefesto usa para desenvolvimento do Dashboard, STM Contempla e integrações. Mariana usa para automações e scripts operacionais. Requer bash com suporte a pty:true.",
    agents: ["hefesto", "mariana"],
    color: "#B87333",
  },
  {
    id: "gog",
    name: "Google Workspace (gog)",
    emoji: "📧",
    category: "produtividade",
    description: "CLI completa para todo o ecossistema Google Workspace: Gmail, Google Calendar, Drive, Contacts, Sheets e Docs. Permite enviar emails, criar eventos, fazer upload de arquivos e manipular planilhas via linha de comando.",
    whenToUse: [
      "Enviar ou buscar emails do Gmail",
      "Criar, editar ou listar eventos no Calendar",
      "Fazer upload de arquivos no Drive",
      "Ler ou escrever em Google Sheets",
      "Exportar Google Docs para PDF ou HTML",
      "Gerenciar contatos do Google",
    ],
    howWeUse: "Hera usa para agenda e calendário do Yuri. Mariana usa para upload de entregas no Drive. Apollo usa para exportar documentos. Conta: yuri.moraes@stmgroup.com.br via Service Account com Domain-Wide Delegation.",
    agents: ["mariana", "hera", "apollo"],
    homepage: "https://gogcli.sh",
    color: "#4285F4",
  },
  {
    id: "healthcheck",
    name: "Healthcheck",
    emoji: "🛡️",
    category: "infraestrutura",
    description: "Auditoria de segurança e hardening para deployments OpenClaw. Verifica firewall, SSH, atualizações pendentes, postura de risco e versões dos serviços. Ideal para manter o VPS seguro e bem configurado.",
    whenToUse: [
      "Auditorias de segurança do servidor",
      "Hardening de firewall e SSH",
      "Verificação de atualizações pendentes",
      "Revisão de exposição e risco",
      "Verificação de versões dos serviços",
    ],
    howWeUse: "Mariana usa periodicamente para verificar a saúde do VPS srv1404877 onde o Panteão roda. Hefesto usa antes de deploys críticos.",
    agents: ["mariana", "hefesto"],
    color: "#22C55E",
  },
  {
    id: "oracle",
    name: "Oracle",
    emoji: "🔮",
    category: "dados",
    description: "CLI para prompts avançados com bundling de arquivos e contexto. Permite enviar múltiplos arquivos como contexto para modelos de IA, gerenciar sessões e padrões de attachment. Ideal para análises que precisam de documentos de referência.",
    whenToUse: [
      "Análises com múltiplos arquivos de contexto",
      "Prompts que precisam de documentos de referência",
      "Sessões de análise persistentes",
      "Consultas com padrões de attachment complexos",
    ],
    howWeUse: "Atena usa para análises estratégicas com base em documentos. Apollo usa para produção de conteúdo com briefings anexados. Afrodite usa para campanhas com contexto de marca.",
    agents: ["atena", "apollo", "afrodite", "hera", "ares"],
    homepage: "https://askoracle.dev",
    color: "#8B5CF6",
  },
  {
    id: "skill-creator",
    name: "Skill Creator",
    emoji: "🛠️",
    category: "infraestrutura",
    description: "Cria e atualiza AgentSkills para o OpenClaw. Permite projetar, estruturar e empacotar novas skills com scripts, referências e assets. Usado para expandir as capacidades do sistema.",
    whenToUse: [
      "Criar uma nova skill customizada",
      "Atualizar skills existentes",
      "Empacotar scripts e assets como skill reutilizável",
      "Estruturar integrações novas como skill",
    ],
    howWeUse: "Mariana e Hefesto usam quando identificamos uma automação recorrente que vale virar skill permanente no sistema.",
    agents: ["mariana", "hefesto"],
    color: "#F59E0B",
  },
  {
    id: "summarize",
    name: "Summarize",
    emoji: "📝",
    category: "conteudo",
    description: "Sumariza e extrai texto de URLs, podcasts, vídeos do YouTube e arquivos locais. Ótimo fallback para transcrever qualquer vídeo ou áudio. Suporta diferentes níveis de profundidade (short, medium, long).",
    whenToUse: [
      "Resumir artigos ou páginas web",
      "Transcrever vídeos do YouTube",
      "Extrair texto de podcasts",
      "Resumir arquivos PDF ou documentos locais",
      "Fallback para qualquer conteúdo audiovisual",
    ],
    howWeUse: "Atena usa para pesquisa de mercado (resumir artigos e relatórios). Apollo usa para processar materiais de referência antes de escrever. Ares usa para revisar conteúdos externos. Usamos também para processar cursos e materiais de treinamento (ex: VTSD 27 vídeos).",
    agents: ["atena", "apollo", "afrodite", "ares"],
    homepage: "https://summarize.sh",
    requires: "summarize CLI instalado",
    color: "#06B6D4",
  },
  {
    id: "tmux",
    name: "Tmux",
    emoji: "🖥️",
    category: "infraestrutura",
    description: "Controla sessões tmux de forma remota — envia teclas, captura output de painéis e automatiza CLIs interativas que precisam de TTY. Essencial para comandos que não funcionam em modo não-interativo.",
    whenToUse: [
      "CLIs interativas que precisam de TTY",
      "Monitorar processos rodando em background",
      "Enviar inputs para sessões de terminal ativas",
      "Capturar output de sessões remotas",
    ],
    howWeUse: "Hefesto usa para gerenciar deploys e processos de build que precisam de terminal interativo. Mariana usa para monitorar scripts de longa duração.",
    agents: ["hefesto", "mariana"],
    requires: "tmux instalado no sistema",
    color: "#84CC16",
  },
  {
    id: "video-frames",
    name: "Video Frames",
    emoji: "🎬",
    category: "conteudo",
    description: "Extrai frames individuais ou clipes curtos de vídeos usando ffmpeg. Permite capturar momentos específicos, criar thumbnails ou extrair sequências de imagens de qualquer vídeo.",
    whenToUse: [
      "Extrair frames de vídeos para thumbnails",
      "Cortar clipes curtos de vídeos maiores",
      "Capturar sequências de imagens de vídeo",
      "Pré-processar vídeos para pipeline de IA",
    ],
    howWeUse: "Usado no pipeline de produção de vídeo do Panteão Digital: extrai frames para QA visual, cria thumbnails de vídeos dos agentes e prepara clipes para o Instagram @stm.capital.",
    agents: ["apollo", "afrodite", "mariana"],
    homepage: "https://ffmpeg.org",
    requires: "ffmpeg instalado",
    color: "#EF4444",
  },
  {
    id: "weather",
    name: "Weather",
    emoji: "🌤️",
    category: "dados",
    description: "Consulta clima atual e previsões via wttr.in ou Open-Meteo. Sem necessidade de API key. Suporta qualquer localidade do mundo com informações de temperatura, umidade, vento e condições gerais.",
    whenToUse: [
      "Verificar clima atual em qualquer cidade",
      "Previsão do tempo para os próximos dias",
      "Temperatura e condições para eventos externos",
    ],
    whenNotToUse: [
      "Dados históricos de clima",
      "Alertas meteorológicos severos",
      "Análises meteorológicas detalhadas",
    ],
    howWeUse: "Héstia usa para informar o Yuri sobre clima antes de compromissos externos, viagens ou eventos. Nenhuma configuração necessária.",
    agents: ["hestia"],
    homepage: "https://wttr.in/:help",
    requires: "curl",
    color: "#F97316",
  },
];

export const SKILL_CATEGORIES = [
  { id: "desenvolvimento", label: "Desenvolvimento", color: "#B87333" },
  { id: "produtividade", label: "Produtividade", color: "#4285F4" },
  { id: "conteudo", label: "Conteúdo", color: "#06B6D4" },
  { id: "infraestrutura", label: "Infraestrutura", color: "#22C55E" },
  { id: "dados", label: "Dados & IA", color: "#8B5CF6" },
  { id: "comunicacao", label: "Comunicação", color: "#EC4899" },
] as const;
