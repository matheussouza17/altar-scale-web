"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import {
  mesAtual,
  proximoMes,
  formatarMesAno,
  formatarDataCurta,
  formatarHorario,
} from "@/lib/utils";
import type { Missa } from "@/types";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export default function MissasPage() {
  const [mesAno, setMesAno] = useState(mesAtual);
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
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Missas</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Gerencie escalas e funções por celebração.
        </p>
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
                    {formatarDataCurta(missa.data).split("/")[1] &&
                      new Date(missa.data)
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
                    {missa.tipo === "ESPECIAL" && (
                      <Badge variant="yellow">Especial</Badge>
                    )}
                    {!missa.ativa && <Badge variant="red">Inativa</Badge>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {missa.funcoes.length} função
                    {missa.funcoes.length !== 1 ? "ões" : ""} ·{" "}
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
    </div>
  );
}
