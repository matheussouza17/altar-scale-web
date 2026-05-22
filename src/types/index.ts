export type PapelUsuario = "SERVIDOR" | "COORDENADOR" | "ADMIN";
export type TipoMissa = "DOMINICAL" | "ESPECIAL";
export type HorarioMissa = "H09" | "H18";
export type StatusDisponibilidade = "DISPONIVEL" | "INDISPONIVEL";

export interface User {
  id: string;
  email: string;
  nome: string;
  telefone: string | null;
  ativo: boolean;
  papel: PapelUsuario;
  createdAt: string;
}

export interface Funcao {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  padrao: boolean;
  ativo: boolean;
}

export interface MissaFuncao {
  id: string;
  missaId: string;
  funcaoId: string;
  quantidade: number;
  obrigatoria: boolean;
  funcao: Funcao;
}

export interface EscalaUser {
  id: string;
  nome: string;
  email: string;
}

export interface Escala {
  id: string;
  missaId: string;
  funcaoId: string;
  userId: string;
  vaga: number;
  user: EscalaUser;
  funcao: Funcao;
}

export interface Missa {
  id: string;
  titulo: string | null;
  data: string;
  horario: HorarioMissa;
  tipo: TipoMissa;
  observacoes: string | null;
  ativa: boolean;
  publicadaEm: string | null;
  createdAt: string;
  funcoes: MissaFuncao[];
  escalas?: Escala[];
  _count?: { escalas: number };
}

export interface Disponibilidade {
  id: string;
  userId: string;
  mesAno: string;
  data: string;
  horario: HorarioMissa;
  status: StatusDisponibilidade;
}

export interface ServidorDisponivel {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  funcoesNaMissa: {
    funcaoId: string;
    codigo: string;
    nome: string;
    vaga: number;
  }[];
  jaEscaladoNestaFuncao?: boolean;
}

export interface DisponibilidadeItem {
  data: string;
  horario: HorarioMissa;
  status: StatusDisponibilidade;
}
