"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import {
  mesAtual,
  proximoMes,
  formatarMesAno,
  formatarDataCurta,
  toDateString,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import type {
  Disponibilidade,
  DisponibilidadeItem,
  Missa,
  StatusDisponibilidade,
  User,
} from "@/types";
import { ArrowLeft, Trash2, Save, KeyRound, Mail } from "lucide-react";

type SlotKey = string;

function slotKey(data: string, horario: string): SlotKey {
  return `${data}|${horario}`;
}

function labelHorario(horario: string): string {
  return horario.replace(":", "h");
}

export default function ServidorPerfilPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [editNome, setEditNome] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editError, setEditError] = useState("");
  const [editSaved, setEditSaved] = useState(false);

  const [resetSaved, setResetSaved] = useState(false);
  const [resetError, setResetError] = useState("");

  const [mesAno, setMesAno] = useState(mesAtual);
  const [slots, setSlots] = useState<Record<SlotKey, StatusDisponibilidade>>({});
  const [dispSaved, setDispSaved] = useState(false);
  const [dispError, setDispError] = useState("");

  const meses = useMemo(() => [mesAtual(), proximoMes()], []);

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const res = await api.get<{ data: User }>(`/users/${id}`);
      return res.data.data;
    },
  });

  useEffect(() => {
    if (user) {
      setEditNome(user.nome);
      setEditTelefone(user.telefone ?? "");
    }
  }, [user]);

  const { data: missasData } = useQuery({
    queryKey: ["missas", mesAno],
    queryFn: async () => {
      const res = await api.get<{ data: Missa[] }>("/missas", {
        params: { mesAno, ativa: "true" },
      });
      return res.data.data;
    },
  });

  const { data: dispData } = useQuery({
    queryKey: ["disponibilidades", id, mesAno],
    queryFn: async () => {
      const res = await api.get<{ data: Disponibilidade[] }>("/disponibilidades", {
        params: { mesAno, userId: id },
      });
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!dispData) return;
    const initial: Record<SlotKey, StatusDisponibilidade> = {};
    dispData.forEach((d) => {
      initial[slotKey(toDateString(d.data), d.horario)] = d.status;
    });
    setSlots(initial);
  }, [dispData]);

  const editMutation = useMutation({
    mutationFn: () =>
      api.put(`/users/${id}`, {
        nome: editNome || undefined,
        telefone: editTelefone || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user", id] });
      qc.invalidateQueries({ queryKey: ["users"] });
      setEditSaved(true);
      setEditError("");
      setTimeout(() => setEditSaved(false), 3000);
    },
    onError: (err) => setEditError(getApiError(err)),
  });

  const resetSenhaMutation = useMutation({
    mutationFn: () => api.post(`/users/${id}/enviar-reset`),
    onSuccess: () => {
      setResetSaved(true);
      setResetError("");
      setTimeout(() => setResetSaved(false), 5000);
    },
    onError: (err) => setResetError(getApiError(err)),
  });

  const excluirMutation = useMutation({
    mutationFn: () => api.delete(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      router.replace("/servidores");
    },
    onError: (err) => setEditError(getApiError(err)),
  });

  const missasPorData = useMemo(() => {
    const map = new Map<string, Missa[]>();
    (missasData ?? []).forEach((m) => {
      const d = toDateString(m.data);
      const list = map.get(d) ?? [];
      list.push(m);
      map.set(d, list);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [missasData]);

  const dispMutation = useMutation({
    mutationFn: async () => {
      const itens: DisponibilidadeItem[] = [];
      (missasData ?? []).forEach((m) => {
        const data = toDateString(m.data);
        itens.push({
          data,
          horario: m.horario,
          status: slots[slotKey(data, m.horario)] ?? "INDISPONIVEL",
        });
      });
      await api.put("/disponibilidades", { mesAno, itens }, { params: { userId: id } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disponibilidades", id, mesAno] });
      setDispSaved(true);
      setDispError("");
      setTimeout(() => setDispSaved(false), 3000);
    },
    onError: (err) => setDispError(getApiError(err)),
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  if (!user) {
    return <p className="text-sm text-gray-500">Servidor não encontrado.</p>;
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Cabeçalho */}
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-gray-900 truncate">{user.nome}</h1>
            <Badge variant={user.papel === "COORDENADOR" ? "blue" : "gray"}>
              {user.papel === "COORDENADOR" ? "Coord." : "Servidor"}
            </Badge>
            {!user.ativo && <Badge variant="red">Inativo</Badge>}
          </div>
          <p className="text-sm text-gray-400 truncate">{user.email}</p>
        </div>
      </div>

      {/* Dados pessoais */}
      <section className="mb-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <h2 className="mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Dados pessoais
        </h2>
        <div className="flex flex-col gap-4">
          <Input
            label="Nome"
            value={editNome}
            onChange={(e) => { setEditNome(e.target.value); setEditError(""); }}
          />
          <Input
            label="Telefone"
            value={editTelefone}
            onChange={(e) => { setEditTelefone(e.target.value); setEditError(""); }}
            placeholder="(62) 99999-9999"
          />
        </div>

        {editError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <Button
            size="sm"
            variant="danger"
            loading={excluirMutation.isPending}
            onClick={() => {
              if (confirm(`Excluir ${user.nome} permanentemente?`)) {
                excluirMutation.mutate();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>

          <div className="flex items-center gap-3">
            {editSaved && <span className="text-sm text-green-600 font-medium">Salvo!</span>}
            <Button
              size="sm"
              loading={editMutation.isPending}
              disabled={!editNome}
              onClick={() => editMutation.mutate()}
            >
              <Save className="h-4 w-4" />
              Salvar
            </Button>
          </div>
        </div>
      </section>

      {/* Resetar senha */}
      <section className="mb-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Senha
          </h2>
          <Button
            size="sm"
            variant="secondary"
            loading={resetSenhaMutation.isPending}
            onClick={() => resetSenhaMutation.mutate()}
          >
            <Mail className="h-4 w-4" />
            Enviar link de redefinição
          </Button>
        </div>

        {resetSaved && (
          <p className="mt-3 text-sm font-medium text-green-600">
            Email enviado para {user.email}.
          </p>
        )}

        {resetError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{resetError}</p>
        )}
      </section>

      {/* Disponibilidade */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <h2 className="mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Disponibilidade
        </h2>

        <div className="mb-4 flex gap-2">
          {meses.map((m) => (
            <button
              key={m}
              onClick={() => { if (m !== mesAno) { setMesAno(m); setSlots({}); } }}
              className={cn(
                "flex-1 sm:flex-none rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                mesAno === m
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {formatarMesAno(m)}
            </button>
          ))}
        </div>

        {missasPorData.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">
            Nenhuma missa encontrada para este mês.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {missasPorData.map(([data, missas]) => (
              <div
                key={data}
                className="rounded-lg border border-gray-100 px-3 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {formatarDataCurta(data + "T00:00:00Z")}
                    </p>
                    {missas.some((m) => m.tipo === "ESPECIAL") && (
                      <p className="text-xs text-amber-600 truncate">
                        {missas.find((m) => m.tipo === "ESPECIAL")?.titulo ?? "Especial"}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {missas.map((m) => {
                      const key = slotKey(data, m.horario);
                      const disponivel = slots[key] === "DISPONIVEL";
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSlots((prev) => ({
                              ...prev,
                              [key]: prev[key] === "DISPONIVEL" ? "INDISPONIVEL" : "DISPONIVEL",
                            }));
                            setDispError("");
                          }}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-sm font-medium border transition-all min-w-[60px]",
                            disponivel
                              ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                              : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50",
                          )}
                        >
                          {labelHorario(m.horario)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {dispError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{dispError}</p>
        )}

        {missasPorData.length > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <Button
              size="sm"
              className="w-full sm:w-auto"
              loading={dispMutation.isPending}
              onClick={() => dispMutation.mutate()}
            >
              Salvar disponibilidade
            </Button>
            {dispSaved && <span className="text-sm text-green-600 font-medium">Salvo!</span>}
          </div>
        )}
      </section>
    </div>
  );
}
