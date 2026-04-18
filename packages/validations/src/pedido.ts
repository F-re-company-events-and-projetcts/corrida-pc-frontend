import { z } from "zod";
import { InscricaoSchema } from "./inscricao";

const MetodoPagamentoEnum = z.enum(["PIX", "CARTAO"]);

export const CriarPedidoSchema = z.object({
  inscricoes: z
    .array(InscricaoSchema)
    .min(1, "Deve haver pelo menos 1 inscrito")
    .max(5, "Máximo de 5 inscritos por pedido"),
  metodoPagamento: MetodoPagamentoEnum,
});

export type CriarPedidoInput = z.infer<typeof CriarPedidoSchema>;
