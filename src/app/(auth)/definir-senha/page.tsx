"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api, getApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function DefinirSenhaForm() {
  const searchParams = useSearchParams();
  const { loginWithToken } = useAuth();
  const token = searchParams.get("token") ?? "";

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) setError("Link inválido. Solicite um novo ao coordenador.");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (novaSenha.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmar) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<{ token: string }>("/auth/definir-senha", {
        token,
        novaSenha,
      });
      loginWithToken(res.data.token);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
      <div className="mb-8 text-center">
        <p className="text-2xl font-bold text-blue-700">EscalaAltar</p>
        <p className="mt-1 text-sm text-gray-500">Defina sua senha de acesso</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nova senha"
          type="password"
          value={novaSenha}
          onChange={(e) => { setNovaSenha(e.target.value); setError(""); }}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          autoFocus
          disabled={!token}
        />
        <Input
          label="Confirmar senha"
          type="password"
          value={confirmar}
          onChange={(e) => { setConfirmar(e.target.value); setError(""); }}
          placeholder="Repita a senha"
          autoComplete="new-password"
          disabled={!token}
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <Button
          type="submit"
          loading={loading}
          disabled={!token || !novaSenha || !confirmar}
          className="mt-2 w-full"
        >
          Definir senha e entrar
        </Button>
      </form>
    </div>
  );
}

export default function DefinirSenhaPage() {
  return (
    <Suspense>
      <DefinirSenhaForm />
    </Suspense>
  );
}
