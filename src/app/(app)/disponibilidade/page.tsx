"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  mesAtual,
  proximoMes,
  formatarMesAno,
  formatarDataCurta,
  toDateString,
} from "@/lib/utils";
import type {
  Disponibilidade,
  DisponibilidadeItem,
  Missa,
  StatusDisponibilidade,
} from "@/types";
import { cn } from "@/lib/utils";

type SlotKey = string;

function slotKey(data: string, horario: string): SlotKey {
  return `${data}|${horario}`;
}

function labelHorario(horario: string): string {
  return horario.replace(":", "h");
}

export default function DisponibilidadePage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [mesAno, setMesAno] = useState(proximoMes);
  const [slots, setSlots] = useState<Record<SlotKey, StatusDisponibilidade>>({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const meses = useMemo(() => [mesAtual(), proximoMes()], []);

  const { data: missasData, isLoading: loadingMissas } = useQuery({
    queryKey: ["missas", mesAno],
    queryFn: async () => {
      const res = await api.get<{ data: Missa[] }>("/missas", {
        params: { mesAno, ativa: "true" },
      });
      return res.data.data;
    },
  });

  const { data: dispData, isLoading: loadingDisp } = useQuery({
    queryKey: ["disponibilidades", user?.id, mesAno],
    queryFn: async () => {
      const res = await api.get<{ data: Disponibilidade[] }>("/disponibilidades", {
        params: { mesAno },
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

  const mutation = useMutation({
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
      await api.put("/disponibilidades", { mesAno, itens });
    },
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["disponibilidades", user?.id, mesAno] });
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err) => setError(getApiError(err)),
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

  function toggle(data: string, horario: string) {
    const key = slotKey(data, horario);
    setSlots((prev) => ({
      ...prev,
      [key]: prev[key] === "DISPONIVEL" ? "INDISPONIVEL" : "DISPONIVEL",
    }));
    setError("");
  }

  const loading = loadingMissas || loadingDisp;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Minha Disponibilidade</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Marque os dias em que você pode servir.
        </p>
      </div>

      {/* Seletor de mês */}
      <div className="mb-5 flex gap-2">
        {meses.map((m) => (
          <button
            key={m}
            onClick={() => { setMesAno(m); setSlots({}); }}
            className={cn(
              "flex-1 sm:flex-none rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize",
              mesAno === m
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50",
            )}
          >
            {formatarMesAno(m)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : missasPorData.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Nenhuma missa encontrada para este mês.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {missasPorData.map(([data, missas]) => (
            <div
              key={data}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm">
                    {formatarDataCurta(data + "T00:00:00Z")}
                  </p>
                  {missas.some((m) => m.tipo === "ESPECIAL") && (
                    <p className="text-xs text-amber-600 truncate">
                      {missas.find((m) => m.tipo === "ESPECIAL")?.titulo ?? "Missa especial"}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  {missas.map((m) => {
                    const key = slotKey(data, m.horario);
                    const disponivel = slots[key] === "DISPONIVEL";
                    return (
                      <button
                        key={m.id}
                        onClick={() => toggle(data, m.horario)}
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm font-medium transition-all border min-w-[64px]",
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

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {missasPorData.length > 0 && (
        <div className="mt-5 flex items-center gap-4">
          <Button
            className="w-full sm:w-auto"
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
          >
            Salvar disponibilidade
          </Button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">Salvo!</span>
          )}
        </div>
      )}
    </div>
  );
}
