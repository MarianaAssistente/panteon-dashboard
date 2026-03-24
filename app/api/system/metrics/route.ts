import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/knowledge?code=eq.SYS-METRICS&select=content`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "VPS metrics unavailable" }, { status: 503 });
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "VPS metrics unavailable" }, { status: 503 });
    }

    const flat = JSON.parse(rows[0].content);

    // Verificar frescor dos dados (máx 90s)
    const updatedAt = new Date(flat.updated_at).getTime();
    const ageSeconds = Math.round((Date.now() - updatedAt) / 1000);
    if (ageSeconds > 90) {
      return NextResponse.json({ error: "VPS metrics unavailable" }, { status: 503 });
    }

    // Transformar formato flat → nested (compatível com o componente)
    return NextResponse.json({
      timestamp: Date.now() / 1000,
      cpu: { percent: flat.cpu_percent, count: flat.cpu_count },
      memory: {
        total_gb: flat.mem_total_gb,
        used_gb: flat.mem_used_gb,
        percent: flat.mem_percent,
      },
      disk: {
        total_gb: flat.disk_total_gb,
        used_gb: flat.disk_used_gb,
        percent: flat.disk_percent,
      },
      network: {
        bytes_sent_mb: flat.net_sent_mb,
        bytes_recv_mb: flat.net_recv_mb,
      },
      processes: {
        gateway: flat.proc_gateway,
        relay: flat.proc_relay,
        cron: flat.proc_cron,
      },
      uptime_seconds: flat.uptime_seconds,
      online: true,
      age_seconds: ageSeconds,
    });
  } catch (e) {
    console.error("metrics error:", e);
    return NextResponse.json({ error: "VPS metrics unavailable" }, { status: 503 });
  }
}
