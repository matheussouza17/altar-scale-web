import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { HorarioMissa } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const DIAS_SEMANA_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/** "2025-07-06T00:00:00.000Z" → Date com dia correto em UTC */
export function parseUtcDate(iso: string): Date {
  return new Date(iso);
}

export function formatarData(iso: string): string {
  const d = new Date(iso);
  const dia = String(d.getUTCDate()).padStart(2, "0");
  const mes = MESES[d.getUTCMonth()];
  const ano = d.getUTCFullYear();
  const diaSemana = DIAS_SEMANA[d.getUTCDay()];
  return `${diaSemana}, ${dia} de ${mes} de ${ano}`;
}

export function formatarDataCurta(iso: string): string {
  const d = new Date(iso);
  const dia = String(d.getUTCDate()).padStart(2, "0");
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}`;
}

export function formatarHorario(horario: HorarioMissa): string {
  return horario === "H09" ? "09h00" : "18h00";
}

export function formatarMesAno(mesAno: string): string {
  const [ano, mes] = mesAno.split("-");
  return `${MESES[Number(mes) - 1]} de ${ano}`;
}

/** Retorna "YYYY-MM" do mês atual */
export function mesAtual(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Retorna "YYYY-MM" do próximo mês */
export function proximoMes(): string {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** "2025-07-06T00:00:00.000Z" → "2025-07-06" */
export function toDateString(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function diaSemanaAbrev(iso: string): string {
  return DIAS_SEMANA_CURTO[new Date(iso).getUTCDay()];
}
