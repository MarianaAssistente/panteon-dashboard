import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRED_PASS    = process.env.CRED_PASSWORD!;

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || password !== CRED_PASS) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    }

    const supabase = createClient<any>(SUPABASE_URL, SERVICE_KEY);

    // Fetch ALL credentials — single query by category
    const { data, error } = await supabase
      .from("knowledge")
      .select("code,title,content,category,tags,importance,updated_at")
      .eq("category", "credencial")
      .order("importance", { ascending: false })
      .order("code");

    if (error) throw error;

    return NextResponse.json({ credentials: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
