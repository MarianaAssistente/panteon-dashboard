"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(from);
        router.refresh();
      } else if (res.status === 429) {
        setError("Acesso bloqueado temporariamente. Tente novamente em 15 minutos.");
        setLoading(false);
      } else {
        setError("Acesso não autorizado.");
        setLoading(false);
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&display=swap');
        .font-cormorant { font-family: 'Cormorant Garamond', serif; }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: "#080808" }}
      >
        <div className="w-full max-w-sm">
          {/* Logo / Branding */}
          <div className="text-center mb-10">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{
                background: "radial-gradient(circle at 40% 40%, #D4AF3722, #D4AF3706)",
                border: "1px solid #D4AF3740",
              }}
            >
              <span style={{ fontSize: "28px" }}>⚡</span>
            </div>
            <h1
              className="font-cormorant"
              style={{
                fontSize: "28px",
                fontWeight: 600,
                color: "#D4AF37",
                letterSpacing: "0.04em",
                lineHeight: 1.2,
              }}
            >
              Panteão do Olimpo
            </h1>
            <p style={{ color: "#ffffff22", fontSize: "12px", marginTop: "6px", letterSpacing: "0.12em" }}>
              STM GROUP — ACESSO RESTRITO
            </p>
          </div>

          {/* Card */}
          <form
            onSubmit={handleSubmit}
            style={{
              background: "#111111",
              border: "1px solid #D4AF3722",
              borderRadius: "16px",
              padding: "28px 24px",
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              <label
                className="font-cormorant"
                style={{
                  display: "block",
                  color: "#D4AF3799",
                  fontSize: "13px",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  marginBottom: "8px",
                }}
              >
                Senha de Acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                autoComplete="current-password"
                style={{
                  width: "100%",
                  background: "#080808",
                  border: "1px solid #D4AF3730",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  color: "#F5F5F5",
                  fontSize: "15px",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#D4AF3780")}
                onBlur={(e) => (e.target.style.borderColor = "#D4AF3730")}
              />
            </div>

            {/* Error message */}
            {error && (
              <div
                style={{
                  background: "#ff444410",
                  border: "1px solid #ff444430",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                }}
              >
                <p style={{ color: "#ff8888", fontSize: "13px", textAlign: "center" }}>
                  {error}
                </p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !password}
              className="font-cormorant"
              style={{
                width: "100%",
                background: loading || !password ? "#D4AF3740" : "#D4AF37",
                color: loading || !password ? "#D4AF3780" : "#080808",
                border: "none",
                borderRadius: "10px",
                padding: "13px",
                fontSize: "16px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                cursor: loading || !password ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {loading ? "Verificando..." : "Entrar no Olimpo"}
            </button>
          </form>

          <p
            style={{
              color: "#ffffff10",
              fontSize: "11px",
              textAlign: "center",
              marginTop: "24px",
              letterSpacing: "0.08em",
            }}
          >
            PANTEÃO DO OLIMPO · STM GROUP © 2026
          </p>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
