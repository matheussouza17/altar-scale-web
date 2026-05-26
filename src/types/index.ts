export type PapelUsuario = "SERVIDOR" | "COORDENADOR" | "ADMIN";
export type TipoMissa = "DOMINICAL" | "ESPECIAL";
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
  observacao: string | null;
  user: EscalaUser;
  funcao: Funcao;
}

export interface Missa {
  id: string;
  titulo: string | null;
  data: string;
  horario: string; // "HH:MM" — ex: "09:00", "18:00", "19:30"
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
  data: string;
  horario: string;
  status: StatusDisponibilidade;
}

export interface ProximaMissaFuncao {
  escalaId: string;
  codigo: string;
  nome: string;
  vaga: number;
  observacao: string | null;
}

export interface ProximaMissa {
  missaId: string;
  data: string;
  horario: string;
  titulo: string | null;
  tipo: TipoMissa;
  publicada: boolean;
  funcoes: ProximaMissaFuncao[];
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
  horario: string;
  status: StatusDisponibilidade;
}
