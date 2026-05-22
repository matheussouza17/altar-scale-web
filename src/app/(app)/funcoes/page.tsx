"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import type { Funcao } from "@/types";
import { Pencil, Check, X } from "lucide-react";

// ── Linha editável ────────────────────────────────────────────────────────────

function FuncaoRow({ funcao }: { funcao: Funcao }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState(funcao.nome);
  const [descricao, setDescricao] = useState(funcao.descricao ?? "");
  const [padrao, setPadrao] = useState(funcao.padrao);
  const [ordem, setOrdem] = useState(funcao.ordem);
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/funcoes/${funcao.id}`, {
        nome: nome || undefined,
        descricao: descricao || null,
        padrao,
        ordem,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funcoes"] });
      setEditing(false);
      setError("");
    },
    onError: (err) => setError(getApiError(err)),
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: () => api.patch(`/funcoes/${funcao.id}`, { ativo: !funcao.ativo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funcoes"] }),
  });

  function cancelar() {
    setNome(funcao.nome);
    setDescricao(funcao.descricao ?? "");
    setPadrao(funcao.padrao);
    setOrdem(funcao.ordem);
    setError("");
    setEditing(false);
  }

  return (
    <div className={cn(
      "rounded-xl border bg-white px-5 py-4 transition-colors",
      !funcao.ativo && "opacity-60",
      editing ? "border-blue-300" : "border-gray-200",
    )}>
      {editing ? (
        // ── modo edição ──
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="w-24 shrink-0 rounded bg-gray-100 px-2 py-1 text-center text-xs font-mono font-semibold text-gray-600">
              {funcao.codigo}
            </span>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Nome da função"
            />
            <input
              type="number"
              value={ordem}
              onChange={(e) => setOrdem(Number(e.target.value))}
              className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-center text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Ordem"
              min={0}
            />
          </div>

          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Descrição (opcional)"
          />

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 select-none">
            <input
              type="checkbox"
              checked={padrao}
              onChange={(e) => setPadrao(e.target.checked)}
              className="rounded"
            />
            Incluir por padrão em novas missas dominicais
          </label>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={cancelar}>
              <X className="h-4 w-4" /> Cancelar
            </Button>
            <Button size="sm" loading={mutation.isPending} onClick={() => mutation.mutate()}>
              <Check className="h-4 w-4" /> Salvar
            </Button>
          </div>
        </div>
      ) : (
        // ── modo leitura ──
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-24 shrink-0 rounded bg-gray-100 px-2 py-1 text-center text-xs font-mono font-semibold text-gray-600">
              {funcao.codigo}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-gray-900">{funcao.nome}</p>
                {funcao.padrao && <Badge variant="blue">Padrão</Badge>}
                {!funcao.ativo && <Badge variant="red">Inativa</Badge>}
              </div>
              {funcao.descricao && (
                <p className="text-xs text-gray-400 truncate">{funcao.descricao}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-400">#{funcao.ordem}</span>
            <Button
              size="sm"
              variant={funcao.ativo ? "secondary" : "ghost"}
              loading={toggleAtivoMutation.isPending}
              onClick={() => toggleAtivoMutation.mutate()}
            >
              {funcao.ativo ? "Desativar" : "Reativar"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function FuncoesPage() {
  const [incluirInativas, setIncluirInativas] = useState(false);

  const { data: funcoes, isLoading } = useQuery({
    queryKey: ["funcoes", incluirInativas],
    queryFn: async () => {
      const res = await api.get<{ data: Funcao[] }>("/funcoes", {
        params: { incluirInativas: incluirInativas ? "true" : "false" },
      });
      return res.data.data;
    },
  });

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Funções litúrgicas</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Edite nome, descrição, ordem e se a função é padrão nas missas.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 select-none">
          <input
            type="checkbox"
            checked={incluirInativas}
            onChange={(e) => setIncluirInativas(e.target.checked)}
            className="rounded"
          />
          Incluir inativas
        </label>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(funcoes ?? []).map((f) => (
            <FuncaoRow key={f.id} funcao={f} />
          ))}
        </div>
      )}
    </div>
  );
}
