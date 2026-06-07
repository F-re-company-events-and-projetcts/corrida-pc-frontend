import { z } from "zod";
import { validarCPF } from "./cpf";

const TamanhoCamisetaEnum = z.enum(["PP", "P", "M", "G", "GG", "XGG"]);

export const InscricaoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cpf: z
    .string()
    .refine(validarCPF, { message: "CPF inválido" }),
  dataNascimento: z
    .string()
    .datetime({ message: "Data de nascimento inválida" })
    .refine((val) => {
      const birth = new Date(val)
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      if (
        today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
      ) age--
      return age >= 15
    }, { message: "Participante deve ter no mínimo 15 anos" }),
  telefone: z
    .string()
    .min(10, "Telefone deve ter no mínimo 10 dígitos")
    .regex(/^\d+$/, "Telefone deve conter apenas números"),
  email: z.string().email("E-mail inválido"),
  contatoEmergencia: z
    .string()
    .min(3, "Contato de emergência deve ter no mínimo 3 caracteres"),
  tamanhoCamiseta: TamanhoCamisetaEnum,
  categoriaId: z.string().min(1, "ID de categoria inválido"),
});

export type InscricaoInput = z.infer<typeof InscricaoSchema>;
