"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import type { Funcao } from "@/types";
import { Pencil, Check, X, Plus, Trash2 } from "lucide-react";

function NovaFuncaoModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [padrao, setPadrao] = useState(false);
  const [ordem, setOrdem] = useState(0);
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.post("/funcoes", { nome, descricao: descricao || null, padrao, ordem }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funcoes"] });
      onClose();
    },
    onError: (err) => setError(getApiError(err)),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">Nova função litúrgica</h2>

        <div className="flex flex-col gap-4">
          <Input
            label="Nome"
            value={nome}
            onChange={(e) => { setNome(e.target.value); setError(""); }}
            placeholder="Ex: Mestre de Cerimônias"
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Descrição <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={descricao}
              onChange={(e) => { setDescricao(e.target.value); setError(""); }}
              placeholder="Breve descrição..."
              rows={2}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1 w-28">
              <label className="text-sm font-medium text-gray-700">Ordem</label>
              <input
                type="number"
                value={ordem}
                onChange={(e) => setOrdem(Number(e.target.value))}
                min={0}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 select-none pt-5">
              <input
                type="checkbox"
                checked={padrao}
                onChange={(e) => setPadrao(e.target.checked)}
                className="rounded"
              />
              Padrão em dominicais
            </label>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button loading={mutation.isPending} disabled={!nome.trim()} onClick={() => mutation.mutate()}>
            Criar
          </Button>
        </div>
      </div>
    </div>
  );
}

function FuncaoRow({ funcao }: { funcao: Funcao }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState(funcao.nome);
  const [descricao, setDescricao] = useState(funcao.descricao ?? "");
  const [padrao, setPadrao] = useState(funcao.padrao);
  const [ordem, setOrdem] = useState(funcao.ordem);
  const [error, setError] = useState("");

  const editMutation = useMutation({
    mutationFn: () =>
      api.patch(`/funcoes/${funcao.id}`, { nome: nome || undefined, descricao: descricao || null, padrao, ordem }),
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
    onError: (err) => setError(getApiError(err)),
  });

  const excluirMutation = useMutation({
    mutationFn: () => api.delete(`/funcoes/${funcao.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funcoes"] }),
    onError: (err) => setError(getApiError(err)),
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
      "rounded-xl border bg-white px-4 py-4 transition-colors",
      !funcao.ativo && "opacity-60",
      editing ? "border-blue-300" : "border-gray-200",
    )}>
      {editing ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Nome da função"
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 shrink-0">Ordem</label>
              <input
                type="number"
                value={ordem}
                onChange={(e) => setOrdem(Number(e.target.value))}
                className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-center text-sm focus:border-blue-500 focus:outline-none"
                min={0}
              />
            </div>
          </div>

          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
            <Button size="sm" loading={editMutation.isPending} onClick={() => editMutation.mutate()}>
              <Check className="h-4 w-4" /> Salvar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-gray-900">{funcao.nome}</p>
                {funcao.padrao && <Badge variant="blue">Padrão</Badge>}
                {!funcao.ativo && <Badge variant="red">Inativa</Badge>}
              </div>
              {funcao.descricao && (
                <p className="text-xs text-gray-400 truncate mt-0.5">{funcao.descricao}</p>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
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
              <Button
                size="sm"
                variant="ghost"
                loading={excluirMutation.isPending}
                onClick={() => {
                  if (confirm(`Excluir "${funcao.nome}"?`)) excluirMutation.mutate();
                }}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </>
      )}
    </div>
  );
}

export default function FuncoesPage() {
  const [incluirInativas, setIncluirInativas] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
    <div className="max-w-2xl mx-auto">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Funções litúrgicas</h1>
          <p className="mt-0.5 text-sm text-gray-500 hidden sm:block">
            Gerencie as funções que podem ser atribuídas nas escalas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 select-none">
            <input
              type="checkbox"
              checked={incluirInativas}
              onChange={(e) => setIncluirInativas(e.target.checked)}
              className="rounded"
            />
            <span className="hidden sm:inline">Inativas</span>
          </label>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova função</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (funcoes ?? []).length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Nenhuma função encontrada.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(funcoes ?? []).map((f) => (
            <FuncaoRow key={f.id} funcao={f} />
          ))}
        </div>
      )}

      {showModal && <NovaFuncaoModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
