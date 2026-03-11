"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

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

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push(from);
      router.refresh();
    } else {
      setError("Senha incorreta.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] text-2xl mx-auto mb-4">⚡</div>
          <h1 className="text-2xl font-bold text-[#D4AF37] tracking-tight">Panteão do Olimpo</h1>
          <p className="text-[#F5F5F5]/30 text-sm mt-1">STM Group — Acesso Restrito</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#141414] border border-[#D4AF37]/15 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-[#F5F5F5]/50 text-xs font-semibold uppercase tracking-wider block mb-2">
              Senha de Acesso
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              className="w-full bg-[#0A0A0A] border border-[#D4AF37]/20 rounded-xl px-4 py-3 text-[#F5F5F5] text-sm focus:outline-none focus:border-[#D4AF37]/60 placeholder:text-[#F5F5F5]/20 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 disabled:bg-[#D4AF37]/30 text-[#0A0A0A] font-bold text-sm py-3 rounded-xl transition-colors"
          >
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>

        <p className="text-[#F5F5F5]/15 text-xs text-center mt-6">
          Panteão do Olimpo · STM Group © 2026
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
