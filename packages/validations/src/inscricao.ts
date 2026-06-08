import { z } from "zod";
import { validarCPF } from "./cpf";

const TamanhoCamisetaEnum = z.enum(["PP", "P", "M", "G", "GG", "XGG"]);
const SexoEnum = z.enum(["MASCULINO", "FEMININO", "OUTRO"]);

export const InscricaoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cpf: z
    .string()
    .refine(validarCPF, { message: "CPF inválido" }),
  dataNascimento: z
    .string()
    .datetime({ message: "Data de nascimento inválida" })
    .refine((val) => {
      // Valida idade mínima de 16 anos na data do evento (27/09/2026)
      const birth = new Date(val)
      const evento = new Date("2026-09-27T12:00:00Z")
      let age = evento.getFullYear() - birth.getFullYear()
      if (
        evento.getMonth() < birth.getMonth() ||
        (evento.getMonth() === birth.getMonth() && evento.getDate() < birth.getDate())
      ) age--
      return age >= 16
    }, { message: "Participante deve ter no mínimo 16 anos na data do evento (27/09/2026)" }),
  telefone: z
    .string()
    .min(10, "Telefone deve ter no mínimo 10 dígitos")
    .regex(/^\d+$/, "Telefone deve conter apenas números"),
  email: z.string().email("E-mail inválido"),
  contatoEmergencia: z.string().optional(),
  sexo: SexoEnum,
  grupoCorrida: z.string().max(100).optional(),
  tamanhoCamiseta: TamanhoCamisetaEnum,
  categoriaId: z.string().min(1, "ID de categoria inválido"),
});

export type InscricaoInput = z.infer<typeof InscricaoSchema>;
