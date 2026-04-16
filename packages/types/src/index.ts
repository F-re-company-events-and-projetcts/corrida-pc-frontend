export type TipoCategoria = "CIDADAO" | "POLICIAL";
export type StatusPedido = "AGUARDANDO_PAGAMENTO" | "PAGO" | "RECUSADO" | "EXPIRADO" | "CANCELADO";
export type MetodoPagamento = "PIX" | "CARTAO";
export type TamanhoCamiseta = "PP" | "P" | "M" | "G" | "GG" | "XGG";

export interface Categoria {
  id: string;
  nome: string;
  percursoKm: number;
  tipo: TipoCategoria;
  vagasTotal: number;
  vagasOcupadas: number;
  vagasDisponiveis: number;
  precoAtual: number | null;
}

export interface Lote {
  id: string;
  nome: string;
  precoCidadao: number;
  ativo: boolean;
  dataInicio: string;
  dataFim: string;
}

export interface Participante {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  email: string;
  contatoEmergencia: string;
  tamanhoCamiseta: TamanhoCamiseta;
  categoriaId: string;
  pedidoId: string;
  numeroPeito?: number;
  checkinRealizadoEm?: string;
}

export interface Pedido {
  id: string;
  total: number;
  status: StatusPedido;
  metodoPagamento: MetodoPagamento;
  paymentId?: string;
  expiresAt?: string;
  participantes: Participante[];
  createdAt: string;
  updatedAt: string;
}
