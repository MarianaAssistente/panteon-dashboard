import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const RELAY_URL = process.env.RELAY_URL!;
const RELAY_SECRET = process.env.RELAY_SECRET!;

export async function POST(request: Request) {
  const { command } = await request.json();

  if (!command) {
    return NextResponse.json({ error: "Comando não informado." }, { status: 400 });
  }

  try {
    const res = await fetch(`${RELAY_URL}/terminal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Relay-Secret": RELAY_SECRET,
      },
      body: JSON.stringify({ command }),
      signal: AbortSignal.timeout(10000),
    });

    if (res.status === 403) {
      return NextResponse.json({ error: "Comando não permitido." }, { status: 403 });
    }

    if (!res.ok) {
      return NextResponse.json({ error: "Relay indisponível." }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "Erro ao conectar ao VPS." }, { status: 503 });
  }
}
