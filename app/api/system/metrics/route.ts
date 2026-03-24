import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("knowledge")
      .select("content, updated_at")
      .eq("code", "SYS-METRICS")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "VPS metrics unavailable" }, { status: 503 });
    }

    const flat = JSON.parse(data.content as string);

    // Verificar se métricas têm menos de 60s (agente ativo)
    const updatedAt = new Date(flat.updated_at).getTime();
    const ageSeconds = Math.round((Date.now() - updatedAt) / 1000);
    if (ageSeconds > 90) {
      return NextResponse.json({ error: "VPS metrics unavailable" }, { status: 503 });
    }

    // Transformar formato flat → nested (compatível com o componente)
    const nested = {
      timestamp: Date.now() / 1000,
      cpu: {
        percent: flat.cpu_percent,
        count: flat.cpu_count,
      },
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
    };

    return NextResponse.json(nested);
  } catch {
    return NextResponse.json({ error: "VPS metrics unavailable" }, { status: 503 });
  }
}
