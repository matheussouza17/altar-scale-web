"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatarData, formatarHorario } from "@/lib/utils";
import type { Funcao, Missa, ServidorDisponivel } from "@/types";
import { ArrowLeft, Copy, Check, X, UserPlus, SlidersHorizontal } from "lucide-react";

function GerenciarFuncoesModal({
  missa,
  onClose,
  onSaved,
}: {
  missa: Missa;
  onClose: () => void;
  onSaved: () => void;
}) {
  const habilitadas = new Set(missa.funcoes.map((mf) => mf.funcaoId));
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set(habilitadas));
  const [error, setError] = useState("");

  const { data: todasFuncoes, isLoading } = useQuery({
    queryKey: ["funcoes", false],
    queryFn: async () => {
      const res = await api.get<{ data: Funcao[] }>("/funcoes", {
        params: { incluirInativas: "false" },
      });
      return res.data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/missas/${missa.id}`, { funcaoIds: [...selecionadas] }),
    onSuccess: () => { onSaved(); onClose(); },
    onError: (err) => setError(getApiError(err)),
  });

  function toggle(id: string) {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setError("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Funções desta missa</h2>
        <p className="mb-4 text-sm text-gray-500">Marque quais funções estarão ativas.</p>

        {isLoading ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {(todasFuncoes ?? []).map((f) => {
              const checked = selecionadas.has(f.id);
              const temEscala = missa.escalas?.some((e) => e.funcaoId === f.id);
              return (
                <label
                  key={f.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50 select-none"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(f.id)}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{f.nome}</p>
                    {temEscala && !checked && (
                      <p className="text-xs text-amber-600">Escalados serão removidos</p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>Salvar</Button>
        </div>
      </div>
    </div>
  );
}

function AdicionarServidor({
  missaId,
  funcaoId,
  onClose,
  onAdded,
}: {
  missaId: string;
  funcaoId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["servidores-disponiveis", missaId, funcaoId],
    queryFn: async () => {
      const res = await api.get<{
        data: { servidores: ServidorDisponivel[]; funcao: { vagasRestantes: number } };
      }>(`/missas/${missaId}/servidores-disponiveis`, { params: { funcaoId } });
      return res.data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: () => api.post(`/missas/${missaId}/escalas`, { funcaoId, userId }),
    onSuccess: () => { onAdded(); onClose(); },
    onError: (err) => setError(getApiError(err)),
  });

  return (
    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
      {isLoading ? (
        <div className="flex justify-center py-2"><Spinner className="h-5 w-5" /></div>
      ) : !data?.servidores.length ? (
        <p className="text-sm text-gray-500">Nenhum servidor disponível para este horário.</p>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={userId}
            onChange={(e) => { setUserId(e.target.value); setError(""); }}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Selecionar servidor...</option>
            {data.servidores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
                {s.funcoesNaMissa.length > 0 &&
                  ` (${s.funcoesNaMissa.map((f) => f.codigo).join(", ")})`}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 sm:flex-none"
              disabled={!userId}
              loading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              Confirmar
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function MissaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [addingFuncao, setAddingFuncao] = useState<string | null>(null);
  const [gerenciarFuncoes, setGerenciarFuncoes] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState("");

  const { data: missa, isLoading } = useQuery({
    queryKey: ["missa", id],
    queryFn: async () => {
      const res = await api.get<{ data: Missa }>(`/missas/${id}`);
      return res.data.data;
    },
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["missa", id] });
    qc.invalidateQueries({ queryKey: ["missas"] });
  }

  const publicarMutation = useMutation({
    mutationFn: () => api.patch(`/missas/${id}/publicar`),
    onSuccess: () => { invalidate(); setActionError(""); },
    onError: (err) => setActionError(getApiError(err)),
  });

  const despublicarMutation = useMutation({
    mutationFn: () => api.patch(`/missas/${id}/despublicar`),
    onSuccess: () => { invalidate(); setActionError(""); },
    onError: (err) => setActionError(getApiError(err)),
  });

  const removerEscalaMutation = useMutation({
    mutationFn: (escalaId: string) => api.delete(`/missas/${id}/escalas/${escalaId}`),
    onSuccess: () => { invalidate(); setActionError(""); },
    onError: (err) => setActionError(getApiError(err)),
  });

  async function handleExportar() {
    try {
      const res = await api.get<{ data: { texto: string } }>(`/missas/${id}/exportar`);
      await navigator.clipboard.writeText(res.data.data.texto);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setActionError("Erro ao copiar escala.");
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  if (!missa) {
    return <div className="text-center text-sm text-gray-500 py-12">Missa não encontrada.</div>;
  }

  const publicada = !!missa.publicadaEm;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Cabeçalho */}
      <div className="mb-5 flex items-start gap-3">
        <button onClick={() => router.back()} className="mt-0.5 text-gray-400 hover:text-gray-600 transition-colors shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold text-gray-900">
              {formatarData(missa.data)} · {formatarHorario(missa.horario)}
            </h1>
            {missa.tipo === "ESPECIAL" && <Badge variant="yellow">Especial</Badge>}
            {publicada ? <Badge variant="green">Publicada</Badge> : <Badge variant="gray">Rascunho</Badge>}
          </div>
          {missa.titulo && <p className="mt-0.5 text-sm text-gray-500 truncate">{missa.titulo}</p>}
        </div>
      </div>

      {/* Ações */}
      <div className="mb-5 flex flex-wrap gap-2">
        {publicada ? (
          <Button variant="secondary" size="sm" loading={despublicarMutation.isPending} onClick={() => despublicarMutation.mutate()}>
            Despublicar
          </Button>
        ) : (
          <Button size="sm" loading={publicarMutation.isPending} onClick={() => publicarMutation.mutate()}>
            Publicar escala
          </Button>
        )}
        {!publicada && (
          <Button variant="secondary" size="sm" onClick={() => setGerenciarFuncoes(true)}>
            <SlidersHorizontal className="h-4 w-4" />
            Funções
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={handleExportar}>
          {copied
            ? <><Check className="h-4 w-4 text-green-600" /> Copiado!</>
            : <><Copy className="h-4 w-4" /> Copiar para WhatsApp</>}
        </Button>
      </div>

      {actionError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>
      )}

      {/* Funções e escala */}
      {missa.funcoes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
          Nenhuma função configurada.{" "}
          {!publicada && (
            <button className="text-blue-600 underline" onClick={() => setGerenciarFuncoes(true)}>
              Adicionar funções
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {missa.funcoes
            .sort((a, b) => a.funcao.ordem - b.funcao.ordem)
            .map((mf) => {
              const escalasNaFuncao = (missa.escalas ?? []).filter((e) => e.funcaoId === mf.funcaoId);
              const aberta = addingFuncao === mf.funcaoId;

              return (
                <div key={mf.id} className="rounded-xl border border-gray-200 bg-white px-4 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{mf.funcao.nome}</p>
                      <p className="text-xs text-gray-400">
                        {escalasNaFuncao.length}/{mf.quantidade} vaga{mf.quantidade !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {escalasNaFuncao.length < mf.quantidade && !publicada && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setAddingFuncao(aberta ? null : mf.funcaoId)}
                      >
                        <UserPlus className="h-4 w-4" />
                        <span className="hidden sm:inline">Adicionar</span>
                      </Button>
                    )}
                  </div>

                  {escalasNaFuncao.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {escalasNaFuncao.map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center gap-1.5 rounded-full bg-gray-100 pl-3 pr-1.5 py-1 text-sm text-gray-800"
                        >
                          {e.user.nome}
                          {!publicada && (
                            <button
                              onClick={() => removerEscalaMutation.mutate(e.id)}
                              className="rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {aberta && !publicada && (
                    <AdicionarServidor
                      missaId={id}
                      funcaoId={mf.funcaoId}
                      onClose={() => setAddingFuncao(null)}
                      onAdded={invalidate}
                    />
                  )}
                </div>
              );
            })}
        </div>
      )}

      {gerenciarFuncoes && (
        <GerenciarFuncoesModal
          missa={missa}
          onClose={() => setGerenciarFuncoes(false)}
          onSaved={invalidate}
        />
      )}
    </div>
  );
}
