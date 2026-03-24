export const dynamic = "force-dynamic";
export async function GET() {
  const url = process.env.RELAY_URL ?? "NAO_DEFINIDO";
  const secret = process.env.RELAY_SECRET ? process.env.RELAY_SECRET.substring(0,8)+"..." : "NAO_DEFINIDO";
  // Tentar conectar
  let connectTest = "não testado";
  try {
    const r = await fetch(`${url}/terminal`, {
      method: "POST",
      headers: {"Content-Type":"application/json","X-Relay-Secret": process.env.RELAY_SECRET ?? ""},
      body: JSON.stringify({command:"uptime"}),
      signal: AbortSignal.timeout(5000),
    });
    connectTest = `HTTP ${r.status}`;
  } catch(e: any) { connectTest = `ERRO: ${e.message}`; }
  return Response.json({ url, secret, connectTest });
}
