import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const ALLOWLIST: Record<string, string> = {
  "status":       "systemctl status openclaw 2>&1 | head -30 || echo 'openclaw não é serviço systemd'",
  "crons":        "crontab -l 2>/dev/null || echo 'sem crontab'",
  "logs-relay":   "tail -50 /tmp/gateway-relay.log 2>/dev/null || echo 'sem log de relay'",
  "logs-metrics": "tail -30 /tmp/push-metrics.log 2>/dev/null || echo 'sem log de métricas'",
  "ps-agents":    "ps aux | grep -E 'openclaw|node|python3' | grep -v grep | head -20",
  "disk":         "df -h / /home 2>/dev/null",
  "memory":       "free -h",
  "uptime":       "uptime && echo '' && who",
  "network":      "ss -tlnp 2>/dev/null | head -20",
  "log-today":    "journalctl --since today --no-pager -n 50 2>/dev/null || tail -50 /tmp/push-metrics.log 2>/dev/null || echo 'sem logs disponíveis'",
};

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { command } = await request.json();

  if (!command || !ALLOWLIST[command]) {
    return NextResponse.json({ error: "Comando não permitido." }, { status: 403 });
  }

  try {
    const { stdout, stderr } = await execAsync(ALLOWLIST[command], {
      timeout: 8000,
      maxBuffer: 1024 * 64,
    });
    return NextResponse.json({
      output: (stdout + stderr).trim() || "(sem saída)",
      command,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      output: err.stdout || err.message || "Erro ao executar comando.",
      command,
      timestamp: new Date().toISOString(),
    });
  }
}
