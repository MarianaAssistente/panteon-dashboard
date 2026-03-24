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

    // Verificar se métricas têm menos de 60s (agente ativo)
    const metrics = JSON.parse(data.content as string);
    const updatedAt = new Date(metrics.updated_at).getTime();
    const ageSeconds = (Date.now() - updatedAt) / 1000;
    metrics.age_seconds = Math.round(ageSeconds);
    metrics.online = ageSeconds < 60;

    return NextResponse.json(metrics);
  } catch {
    return NextResponse.json({ error: "VPS metrics unavailable" }, { status: 503 });
  }
}
