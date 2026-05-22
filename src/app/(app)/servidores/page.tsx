"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api, getApiError } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import type { PapelUsuario, User } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, ChevronRight, Search } from "lucide-react";

// ── Modal: criar usuário ──────────────────────────────────────────────────────

function CriarServidorModal({ onClose }: { onClose: () => void }) {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    nome: "", email: "", senha: "", telefone: "", papel: "SERVIDOR" as PapelUsuario,
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.post("/auth/usuarios", {
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        telefone: form.telefone || undefined,
        papel: form.papel,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: (err) => setError(getApiError(err)),
  });

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">Novo usuário</h2>

        <div className="flex flex-col gap-4">
          {me?.papel === "ADMIN" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Papel</label>
              <select
                value={form.papel}
                onChange={(e) => setForm((f) => ({ ...f, papel: e.target.value as PapelUsuario }))}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="SERVIDOR">Servidor</option>
                <option value="COORDENADOR">Coordenador</option>
              </select>
            </div>
          )}
          <Input
            label="Nome"
            value={form.nome}
            onChange={(e) => set("nome", e.target.value)}
            placeholder="Nome completo"
            required
          />
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="email@exemplo.com"
            required
          />
          <Input
            label="Senha temporária"
            type="password"
            value={form.senha}
            onChange={(e) => set("senha", e.target.value)}
            placeholder="Mínimo 8 caracteres"
            required
          />
          <Input
            label="Telefone (opcional)"
            value={form.telefone}
            onChange={(e) => set("telefone", e.target.value)}
            placeholder="(62) 99999-9999"
          />
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button
            loading={mutation.isPending}
            disabled={!form.nome || !form.email || !form.senha}
            onClick={() => mutation.mutate()}
          >
            Criar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function ServidoresPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [incluirInativos, setIncluirInativos] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", incluirInativos],
    queryFn: async () => {
      const res = await api.get<{ data: User[] }>("/users", {
        params: { incluirInativos: incluirInativos ? "true" : "false" },
      });
      return res.data.data;
    },
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: ({ userId, ativo }: { userId: string; ativo: boolean }) =>
      api.patch(`/users/${userId}`, { ativo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const filtered = (users ?? []).filter(
    (u) =>
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Servidores</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Gerencie os servidores do altar.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <UserPlus className="h-4 w-4" />
          Novo servidor
        </Button>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 select-none">
          <input
            type="checkbox"
            checked={incluirInativos}
            onChange={(e) => setIncluirInativos(e.target.checked)}
            className="rounded"
          />
          Incluir inativos
        </label>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          {search ? "Nenhum servidor encontrado para essa busca." : "Nenhum servidor cadastrado."}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">{user.nome}</p>
                  <Badge variant={user.papel === "COORDENADOR" ? "blue" : "gray"}>
                    {user.papel === "COORDENADOR" ? "Coordenador" : "Servidor"}
                  </Badge>
                  {!user.ativo && <Badge variant="red">Inativo</Badge>}
                </div>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={user.ativo ? "secondary" : "ghost"}
                  loading={
                    toggleAtivoMutation.isPending &&
                    toggleAtivoMutation.variables?.userId === user.id
                  }
                  onClick={() =>
                    toggleAtivoMutation.mutate({ userId: user.id, ativo: !user.ativo })
                  }
                >
                  {user.ativo ? "Desativar" : "Reativar"}
                </Button>
                <Link
                  href={`/servidores/${user.id}`}
                  className="flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <CriarServidorModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
