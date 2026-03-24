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

function parseCrontab(raw: string) {
  const LABELS: Record<string, { name: string; desc: string; category: string }> = {
    "post-seg":        { name: "Post Instagram — Segunda",  desc: "Publicar post semanal às 08h BRT",            category: "instagram" },
    "post-qua":        { name: "Post Instagram — Quarta",   desc: "Publicar post semanal às 12h BRT",            category: "instagram" },
    "post-sex":        { name: "Post Instagram — Sexta",    desc: "Publicar post semanal às 18h BRT",            category: "instagram" },
    "post-dom":        { name: "Post Instagram — Domingo",  desc: "Publicar post semanal às 10h BRT",            category: "instagram" },
    "notify-agents":   { name: "Notificar Agentes",         desc: "Verifica tarefas ativas (a cada 15 min)",     category: "sistema" },
    "gateway-relay":   { name: "Watchdog Relay",            desc: "Reinicia relay se cair (a cada 5 min)",       category: "sistema" },
    "auto-update":     { name: "Auto-Update Dashboard",     desc: "PATCH updated_at no Supabase (a cada 5 min)", category: "sistema" },
    "push-metrics":    { name: "Push Métricas VPS",         desc: "Envia CPU/RAM/Disco ao Supabase (1/min)",     category: "sistema" },
    "terminal-worker": { name: "Watchdog Terminal",         desc: "Reinicia terminal worker se cair (2/min)",    category: "sistema" },
    "start-desktop":   { name: "Desktop Virtual",           desc: "Inicia VNC/XFCE ao reiniciar VPS",            category: "infra" },
    "start-tunnel":    { name: "Túnel Cloudflare",          desc: "Inicia túnel ao reiniciar VPS",               category: "infra" },
    "cloudflared":     { name: "Watchdog Cloudflare",       desc: "Reinicia túnel se cair (a cada 5 min)",       category: "infra" },
    "sync-notion":     { name: "Sync Notion ↔ Trello",      desc: "Sincroniza tasks (sexta 18h BRT)",            category: "gestao" },
    "prioridades":     { name: "Prioridades da Semana",     desc: "Envia check de prioridades (segunda 09h)",    category: "gestao" },
    "destilacao":      { name: "Destilação de Memória",     desc: "Destila memória semanal (domingo 20h)",       category: "gestao" },
    "scheduled-STR":   { name: "Post Stories",              desc: "Story agendado",                              category: "instagram" },
    "scheduled-CAP":   { name: "Post @stm.capital",         desc: "Post agendado STM Capital",                   category: "instagram" },
  };

  const SCHEDULE_LABELS: Record<string, string> = {
    "@reboot":      "Ao reiniciar VPS",
    "* * * * *":    "A cada minuto",
    "*/2 * * * *":  "A cada 2 minutos",
    "*/5 * * * *":  "A cada 5 minutos",
    "*/15 * * * *": "A cada 15 minutos",
    "0 12 * * 1":   "Segunda-feira, 09h BRT",
    "0 21 * * 5":   "Sexta-feira, 18h BRT",
    "0 23 * * 0":   "Domingo, 20h BRT",
  };

  const jobs: any[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    let label = { name: "Tarefa Agendada", desc: trimmed.slice(0, 60), category: "outros" };
    for (const [key, val] of Object.entries(LABELS)) {
      if (trimmed.includes(key)) {
        label = val;
        break;
      }
    }

    let schedule = "";
    let scheduleLabel = "";
    if (trimmed.startsWith("@reboot")) {
      schedule = "@reboot";
      scheduleLabel = "Ao reiniciar VPS";
    } else {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 5) {
        schedule = parts.slice(0, 5).join(" ");
        scheduleLabel = SCHEDULE_LABELS[schedule] || schedule;
      }
    }

    jobs.push({
      id: `cron-${jobs.length}`,
      name: label.name,
      desc: label.desc,
      category: label.category,
      schedule,
      scheduleLabel,
      status: schedule === "@reboot" ? "reboot" : label.name.toLowerCase().includes("watchdog") ? "watchdog" : "ok",
      raw: trimmed,
    });
  }
  return jobs;
}
