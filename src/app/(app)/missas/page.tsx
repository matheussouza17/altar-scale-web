"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api, getApiError } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import {
  mesAtual,
  proximoMes,
  formatarMesAno,
  formatarHorario,
} from "@/lib/utils";
import type { Missa } from "@/types";
import { cn } from "@/lib/utils";
import { ChevronRight, Plus } from "lucide-react";

// ── Modal: nova missa especial ────────────────────────────────────────────────

function NovaMissaEspecialModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    titulo: "",
    data: "",
    horario: "09:00",
    observacoes: "",
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.post("/missas", {
        titulo: form.titulo,
        data: form.data,
        horario: form.horario,
        tipo: "ESPECIAL",
        observacoes: form.observacoes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["missas"] });
      onClose();
    },
    onError: (err) => setError(getApiError(err)),
  });

  function set<K extends keyof typeof form>(field: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">Nova missa especial</h2>

        <div className="flex flex-col gap-4">
          <Input
            label="Título"
            value={form.titulo}
            onChange={(e) => set("titulo", e.target.value)}
            placeholder="Ex: Quinta-Feira Santa, Casamento João e Maria"
            required
          />

          <Input
            label="Data"
            type="date"
            value={form.data}
            onChange={(e) => set("data", e.target.value)}
            required
          />

          <Input
            label="Horário"
            type="time"
            value={form.horario}
            onChange={(e) => set("horario", e.target.value)}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Observações <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              placeholder="Informações adicionais..."
              rows={2}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button
            loading={mutation.isPending}
            disabled={!form.titulo || !form.data}
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

export default function MissasPage() {
  const [mesAno, setMesAno] = useState(mesAtual);
  const [showModal, setShowModal] = useState(false);
  const meses = useMemo(() => [mesAtual(), proximoMes()], []);

  const { data, isLoading } = useQuery({
    queryKey: ["missas", mesAno],
    queryFn: async () => {
      const res = await api.get<{ data: Missa[] }>("/missas", {
        params: { mesAno },
      });
      return res.data.data;
    },
  });

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Missas</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Gerencie escalas e funções por celebração.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Missa especial
        </Button>
      </div>

      {/* Seletor de mês */}
      <div className="mb-6 flex gap-2">
        {meses.map((m) => (
          <button
            key={m}
            onClick={() => setMesAno(m)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors",
              mesAno === m
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50",
            )}
          >
            {formatarMesAno(m)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !data?.length ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Nenhuma missa encontrada para este mês.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((missa) => (
            <Link
              key={missa.id}
              href={`/missas/${missa.id}`}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 transition-colors hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div className="flex items-center gap-4">
                <div className="text-center w-10">
                  <p className="text-lg font-bold text-gray-800 leading-none">
                    {new Date(missa.data).getUTCDate()}
                  </p>
                  <p className="text-xs text-gray-400 uppercase">
                    {new Date(missa.data)
                      .toLocaleString("pt-BR", { month: "short", timeZone: "UTC" })
                      .replace(".", "")}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {formatarHorario(missa.horario)}
                      {missa.titulo && ` — ${missa.titulo}`}
                    </p>
                    {missa.tipo === "ESPECIAL" && <Badge variant="yellow">Especial</Badge>}
                    {!missa.ativa && <Badge variant="red">Inativa</Badge>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {missa.funcoes.length} {missa.funcoes.length !== 1 ? "funções" : "função"} ·{" "}
                    {missa._count?.escalas ?? missa.escalas?.length ?? 0} escalado
                    {(missa._count?.escalas ?? missa.escalas?.length ?? 0) !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {missa.publicadaEm ? (
                  <Badge variant="green">Publicada</Badge>
                ) : (
                  <Badge variant="gray">Rascunho</Badge>
                )}
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && <NovaMissaEspecialModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
