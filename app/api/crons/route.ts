import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function sbUpsert(code: string, content: object) {
  await fetch(`${SUPABASE_URL}/rest/v1/knowledge?on_conflict=code`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      code,
      title: `Terminal ${code}`,
      content: JSON.stringify(content),
      category: "sistema",
      tags: ["crons"],
      importance: "alto",
    }),
    cache: "no-store",
  });
}

async function sbGet(code: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/knowledge?code=eq.${code}&select=content`,
    {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      cache: "no-store",
    }
  );
  const rows = await res.json();
  if (!rows || rows.length === 0) return null;
  return JSON.parse(rows[0].content);
}

export async function GET() {
  const requestId = `crons-${Date.now()}`;
  const ts = Date.now() / 1000;

  await sbUpsert("TERM-OUT", { output: "", request_id: "", ts: 0 });
  await sbUpsert("TERM-CMD", { cmd: "crons-raw", request_id: requestId, ts });

  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 500));
    const result = (await sbGet("TERM-OUT")) as any;
    if (result && result.request_id === requestId && result.output) {
      const jobs = parseCrontab(result.output);
      return NextResponse.json({ jobs, raw: result.output });
    }
  }
  return NextResponse.json({ error: "Timeout ao ler crontab" }, { status: 504 });
}

function extractScriptName(raw: string): string {
  const match = raw.match(/shared\/([^\s]+\.sh)/);
  if (match) return match[1];
  const match2 = raw.match(/python3?\s+[^\s]*\/([^\s]+\.py)/);
  if (match2) return match2[1];
  return "";
}

function parseCrontab(raw: string) {
  const LABELS: Record<string, { name: string; desc: string; category: string }> = {
    "post-seg":        { name: "Post @stm.capital — Segunda",       desc: "Publica post semanal no Instagram @stm.capital às 08h BRT (11h UTC)",        category: "instagram" },
    "post-qua":        { name: "Post @stm.capital — Quarta",        desc: "Publica post semanal no Instagram @stm.capital às 12h BRT (15h UTC)",        category: "instagram" },
    "post-sex":        { name: "Post @stm.capital — Sexta",         desc: "Publica post semanal no Instagram @stm.capital às 18h BRT (21h UTC)",        category: "instagram" },
    "post-dom":        { name: "Post @stm.capital — Domingo",       desc: "Publica post semanal no Instagram @stm.capital às 10h BRT (13h UTC)",        category: "instagram" },
    "scheduled-STR":   { name: "Stories @stm.capital",              desc: "Publica Story agendado no Instagram @stm.capital",                           category: "instagram" },
    "scheduled-CAP":   { name: "Post @stm.capital (agendado)",      desc: "Publica post agendado no Instagram @stm.capital via calendário editorial",   category: "instagram" },
    "scheduled-DIG":   { name: "Post @panteao_digital (agendado)",  desc: "Publica post agendado no Instagram @panteao_digital via calendário",         category: "instagram" },
    "scheduled-post":  { name: "Post Calendário (agendado)",        desc: "Post de conteúdo agendado manualmente — verifique o script para saber a conta destino", category: "instagram" },
    "panteon-publish": { name: "Post @panteao_digital",             desc: "Publica post no Instagram @panteao_digital",                                 category: "instagram" },
    "notify-agents":   { name: "Notificar Agentes",                 desc: "Verifica tarefas ativas no Supabase e notifica agentes via Telegram (a cada 15 min)", category: "sistema" },
    "gateway-relay":   { name: "Watchdog: Relay HTTP",              desc: "Monitora o servidor relay na porta 3099 — reinicia automaticamente se cair (a cada 5 min)", category: "sistema" },
    "relay-watch":     { name: "Watchdog: Relay HTTP",              desc: "Monitora o servidor relay na porta 3099 — reinicia automaticamente se cair (a cada 5 min)", category: "sistema" },
    "auto-update":     { name: "Auto-Update Dashboard",             desc: "Atualiza updated_at das tarefas ativas no Supabase — mantém o indicador verde do dashboard (a cada 5 min)", category: "sistema" },
    "push-metrics":    { name: "Push Métricas VPS",                 desc: "Coleta CPU, RAM, disco e processos do VPS e envia ao Supabase para o Monitor VPS (a cada minuto)", category: "sistema" },
    "terminal-worker": { name: "Watchdog: Terminal Worker",         desc: "Monitora o worker do terminal — reinicia automaticamente se parar de responder (a cada 2 min)", category: "sistema" },
    "start-desktop":   { name: "Desktop Virtual (boot)",            desc: "Inicia o ambiente gráfico XFCE4 + VNC ao reiniciar o VPS — necessário para acesso remoto visual", category: "infra" },
    "start-tunnel":    { name: "Túnel Cloudflare (boot)",           desc: "Inicia o túnel Cloudflare ao reiniciar o VPS — necessário para o domínio dashboard.stmgroup.com.br", category: "infra" },
    "cloudflared":     { name: "Watchdog: Túnel Cloudflare",        desc: "Monitora o túnel Cloudflare — reinicia automaticamente se cair (a cada 5 min)", category: "infra" },
    "sync-notion":     { name: "Sync Notion ↔ Trello",              desc: "Sincroniza tarefas entre Notion e Trello — roda toda sexta-feira às 18h BRT", category: "gestao" },
    "prioridades":     { name: "Prioridades da Semana",             desc: "Envia mensagem de check de prioridades para o Yuri toda segunda-feira às 09h BRT", category: "gestao" },
    "destilacao":      { name: "Destilação de Memória",             desc: "Consolida e destila memória semanal dos agentes todo domingo às 20h BRT",    category: "gestao" },
  };

  const SCHEDULE_LABELS: Record<string, string> = {
    "@reboot":       "Ao reiniciar o VPS",
    "* * * * *":     "A cada minuto",
    "*/2 * * * *":   "A cada 2 minutos",
    "*/5 * * * *":   "A cada 5 minutos",
    "*/15 * * * *":  "A cada 15 minutos",
    "0 11 * * 1":    "Segunda-feira às 08h BRT (11h UTC)",
    "0 12 * * 1":    "Segunda-feira às 09h BRT (12h UTC)",
    "0 15 * * 3":    "Quarta-feira às 12h BRT (15h UTC)",
    "0 21 * * 5":    "Sexta-feira às 18h BRT (21h UTC)",
    "0 13 * * 0":    "Domingo às 10h BRT (13h UTC)",
    "0 23 * * 0":    "Domingo às 20h BRT (23h UTC)",
  };

  const jobs: any[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    let label: { name: string; desc: string; category: string } | null = null;
    for (const [key, val] of Object.entries(LABELS)) {
      if (trimmed.includes(key)) {
        label = val;
        break;
      }
    }

    if (!label) {
      const scriptName = extractScriptName(trimmed);
      label = {
        name: scriptName ? `Script: ${scriptName}` : "Tarefa Agendada",
        desc: scriptName
          ? `Executa o script ${scriptName} conforme o horário definido`
          : `Comando direto: ${trimmed.slice(0, 80)}`,
        category: "outros",
      };
    }

    let schedule = "";
    let scheduleLabel = "";
    if (trimmed.startsWith("@reboot")) {
      schedule = "@reboot";
      scheduleLabel = "Ao reiniciar o VPS";
    } else {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 5) {
        schedule = parts.slice(0, 5).join(" ");
        scheduleLabel = SCHEDULE_LABELS[schedule] || `Agendado: ${schedule}`;
      }
    }

    const isWatchdog = label.name.toLowerCase().includes("watchdog");
    const isReboot = schedule === "@reboot";

    jobs.push({
      id: `cron-${jobs.length}`,
      name: label.name,
      desc: label.desc,
      category: label.category,
      schedule,
      scheduleLabel,
      status: isReboot ? "reboot" : isWatchdog ? "watchdog" : "ok",
      raw: trimmed,
    });
  }
  return jobs;
}
