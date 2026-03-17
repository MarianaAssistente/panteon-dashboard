import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRED_PASS    = process.env.CRED_PASSWORD!;

// Credential codes stored in Supabase knowledge table
const CRED_CODES = [
  "CRED-IG-PANTEAO",
  "CRED-IG-CAPITAL",
  "CRED-SUPABASE",
  "CRED-VERCEL",
  "CRED-ELEVENLABS",
  "CRED-NOTION",
  "CRED-GDRIVE",
  // Also fetch legacy KNW codes
  "KNW-022", // Meta Graph API STM Capital
  "KNW-023", // fal.ai
  "KNW-024", // Creatomate
  "KNW-025", // Hedra
  "KNW-026", // Gemini API
  "KNW-030", // IG Panteao original
];

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || password !== CRED_PASS) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    }

    const supabase = createClient<any>(SUPABASE_URL, SERVICE_KEY);

    const { data, error } = await supabase
      .from("knowledge")
      .select("code,title,content,category,tags,importance,updated_at")
      .in("code", CRED_CODES)
      .order("code");

    if (error) throw error;

    // Also fetch all credentials category
    const { data: allCreds } = await supabase
      .from("knowledge")
      .select("code,title,content,category,tags,importance,updated_at")
      .eq("category", "credencial")
      .not("code", "in", `(${CRED_CODES.map(c => `"${c}"`).join(",")})`)
      .order("code");

    const combined = [...(data ?? []), ...(allCreds ?? [])];

    return NextResponse.json({ credentials: combined });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
