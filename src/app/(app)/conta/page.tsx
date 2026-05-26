"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, getApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Check } from "lucide-react";

export default function ContaPage() {
  const [form, setForm] = useState({ senhaAtual: "", novaSenha: "", confirmar: "" });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      api.patch("/auth/senha", {
        senhaAtual: form.senhaAtual,
        novaSenha: form.novaSenha,
      }),
    onSuccess: () => {
      setForm({ senhaAtual: "", novaSenha: "", confirmar: "" });
      setSaved(true);
      setError("");
      setTimeout(() => setSaved(false), 4000);
    },
    onError: (err) => setError(getApiError(err)),
  });

  function handleSubmit() {
    setError("");
    if (form.novaSenha.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (form.novaSenha !== form.confirmar) {
      setError("As senhas não conferem.");
      return;
    }
    mutation.mutate();
  }

  function set<K extends keyof typeof form>(field: K, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
    setSaved(false);
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Minha Conta</h1>
        <p className="mt-0.5 text-sm text-gray-500">Gerencie suas credenciais de acesso.</p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <h2 className="mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Alterar Senha
        </h2>

        <div className="flex flex-col gap-4">
          <Input
            label="Senha atual"
            type="password"
            value={form.senhaAtual}
            onChange={(e) => set("senhaAtual", e.target.value)}
            autoComplete="current-password"
          />
          <Input
            label="Nova senha"
            type="password"
            value={form.novaSenha}
            onChange={(e) => set("novaSenha", e.target.value)}
            autoComplete="new-password"
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            value={form.confirmar}
            onChange={(e) => set("confirmar", e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-5 flex items-center gap-4">
          <Button
            onClick={handleSubmit}
            loading={mutation.isPending}
            disabled={!form.senhaAtual || !form.novaSenha || !form.confirmar}
          >
            Alterar senha
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
              <Check className="h-4 w-4" />
              Senha alterada!
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
