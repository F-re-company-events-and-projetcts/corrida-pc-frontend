'use client'

import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Trash2, Plus } from 'lucide-react'
import { validarCPF } from '@corrida/validations'
import type { InscricaoInput } from '@corrida/validations'
import type { Categoria } from '@corrida/types'
import { useInscricao } from '@/contexts/InscricaoContext'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Typography } from '@/components/atoms/typography'
import { cn } from '@/lib/utils'

const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'XGG'] as const

function calcularIdade(dateStr: string): number {
  const birth = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) age--
  return age
}

const InscritoFormSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().refine(validarCPF, { message: 'CPF inválido' }),
  dataNascimento: z
    .string()
    .min(1, 'Data de nascimento é obrigatória')
    .refine((val) => !val || calcularIdade(val) >= 15, {
      message: 'Participante deve ter no mínimo 15 anos',
    }),
  telefone: z
    .string()
    .min(10, 'Telefone deve ter no mínimo 10 dígitos')
    .regex(/^\d+$/, 'Apenas números'),
  email: z.string().email('E-mail inválido'),
  contatoEmergencia: z.string().min(3, 'Contato de emergência deve ter no mínimo 3 caracteres'),
  tamanhoCamiseta: z.enum(TAMANHOS),
  categoriaId: z.string().min(1, 'Selecione uma categoria'),
})

type InscritoFormValues = z.infer<typeof InscritoFormSchema>

const DadosFormSchema = z
  .object({ inscritos: z.array(InscritoFormSchema).min(1).max(5) })
  .superRefine(({ inscritos }, ctx) => {
    const seen = new Set<string>()
    inscritos.forEach((inscrito, idx) => {
      const key = inscrito.cpf.replace(/\D/g, '')
      if (key.length === 11 && seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Este CPF já foi adicionado neste pedido',
          path: ['inscritos', idx, 'cpf'],
        })
      }
      seen.add(key)
    })
  })

type DadosFormValues = z.infer<typeof DadosFormSchema>

function toInscricaoInput(v: InscritoFormValues): InscricaoInput {
  return {
    ...v,
    dataNascimento: new Date(v.dataNascimento + 'T12:00:00.000Z').toISOString(),
  }
}

const emptyInscrito = (categoriaId: string): InscritoFormValues => ({
  nome: '',
  cpf: '',
  dataNascimento: '',
  telefone: '',
  email: '',
  contatoEmergencia: '',
  tamanhoCamiseta: 'M',
  categoriaId,
})

interface Props {
  categorias: Categoria[]
}

export function DadosStep({ categorias }: Props) {
  const router = useRouter()
  const { categoriaId, setInscricoes } = useInscricao()

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<DadosFormValues>({
    resolver: zodResolver(DadosFormSchema),
    mode: 'onChange',
    defaultValues: {
      inscritos: [emptyInscrito(categoriaId ?? '')],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'inscritos' })

  function onSubmit(data: DadosFormValues) {
    setInscricoes(data.inscritos.map(toInscricaoInput))
    router.push('/inscricao/revisao')
  }

  const availableCategorias = categorias.filter((c) => c.vagasDisponiveis > 0)
  const firstCategoria = categorias.find((c) => c.id === categoriaId)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      <div>
        <Typography variant="h2" as="h1">
          Dados dos inscritos
        </Typography>
        <Typography variant="p" className="mt-1">
          Preencha os dados de cada participante.
        </Typography>
      </div>

      {fields.map((field, idx) => {
        const fieldErrors = errors.inscritos?.[idx]
        const isFirst = idx === 0

        return (
          <div key={field.id} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Typography variant="h3" as="h2">
                Inscrito {idx + 1}
              </Typography>
              {!isFirst && (
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover
                </button>
              )}
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-bold text-secondary uppercase tracking-wider mb-1">
                Categoria
              </label>
              {isFirst ? (
                <>
                  <div className="px-3 py-2 rounded-xl border border-border bg-gray-50 text-secondary font-medium">
                    {firstCategoria?.nome ?? '—'}
                    {firstCategoria?.precoAtual != null && (
                      <span className="ml-2 text-muted-foreground font-normal">
                        R$ {firstCategoria.precoAtual.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <input type="hidden" {...register(`inscritos.${idx}.categoriaId`)} />
                </>
              ) : (
                <>
                  <select
                    {...register(`inscritos.${idx}.categoriaId`)}
                    className={cn(
                      'w-full px-3 py-2 rounded-xl border bg-white text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      fieldErrors?.categoriaId ? 'border-red-500' : 'border-border'
                    )}
                  >
                    <option value="">Selecione a categoria</option>
                    {availableCategorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                        {c.precoAtual != null ? ` — R$ ${c.precoAtual.toFixed(2)}` : ''}
                      </option>
                    ))}
                  </select>
                  {fieldErrors?.categoriaId && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.categoriaId.message}</p>
                  )}
                </>
              )}
            </div>

            {/* Nome */}
            <div>
              <label className="block text-sm font-bold text-secondary uppercase tracking-wider mb-1">
                Nome completo
              </label>
              <Input
                {...register(`inscritos.${idx}.nome`)}
                placeholder="Nome completo"
                className={fieldErrors?.nome ? 'border-red-500' : ''}
              />
              {fieldErrors?.nome && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.nome.message}</p>
              )}
            </div>

            {/* CPF */}
            <div>
              <label className="block text-sm font-bold text-secondary uppercase tracking-wider mb-1">
                CPF
              </label>
              <Input
                {...register(`inscritos.${idx}.cpf`)}
                placeholder="000.000.000-00"
                maxLength={14}
                className={fieldErrors?.cpf ? 'border-red-500' : ''}
              />
              {fieldErrors?.cpf && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.cpf.message}</p>
              )}
            </div>

            {/* Data de nascimento */}
            <div>
              <label className="block text-sm font-bold text-secondary uppercase tracking-wider mb-1">
                Data de nascimento
              </label>
              <Input
                type="date"
                {...register(`inscritos.${idx}.dataNascimento`)}
                className={fieldErrors?.dataNascimento ? 'border-red-500' : ''}
              />
              {fieldErrors?.dataNascimento && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.dataNascimento.message}</p>
              )}
              {(() => {
                const val = watch(`inscritos.${idx}.dataNascimento`)
                if (!val || fieldErrors?.dataNascimento) return null
                const age = calcularIdade(val)
                if (age >= 15 && age < 18) {
                  return (
                    <p className="mt-1 text-sm text-amber-600">
                      Participante menor de 18 anos — a autorização do responsável legal será exigida no check-in.
                    </p>
                  )
                }
                return null
              })()}
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-bold text-secondary uppercase tracking-wider mb-1">
                Telefone
              </label>
              <Input
                {...register(`inscritos.${idx}.telefone`)}
                placeholder="11999999999"
                inputMode="numeric"
                maxLength={11}
                className={fieldErrors?.telefone ? 'border-red-500' : ''}
              />
              {fieldErrors?.telefone && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.telefone.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-secondary uppercase tracking-wider mb-1">
                E-mail
              </label>
              <Input
                type="email"
                {...register(`inscritos.${idx}.email`)}
                placeholder="seu@email.com"
                className={fieldErrors?.email ? 'border-red-500' : ''}
              />
              {fieldErrors?.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email.message}</p>
              )}
            </div>

            {/* Contato de emergência */}
            <div>
              <label className="block text-sm font-bold text-secondary uppercase tracking-wider mb-1">
                Contato de emergência
              </label>
              <Input
                {...register(`inscritos.${idx}.contatoEmergencia`)}
                placeholder="Nome e telefone de contato"
                className={fieldErrors?.contatoEmergencia ? 'border-red-500' : ''}
              />
              {fieldErrors?.contatoEmergencia && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.contatoEmergencia.message}</p>
              )}
            </div>

            {/* Tamanho da camiseta */}
            <div>
              <label className="block text-sm font-bold text-secondary uppercase tracking-wider mb-1">
                Tamanho da camiseta
              </label>
              <select
                {...register(`inscritos.${idx}.tamanhoCamiseta`)}
                className={cn(
                  'w-full px-3 py-2 rounded-xl border bg-white text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  fieldErrors?.tamanhoCamiseta ? 'border-red-500' : 'border-border'
                )}
              >
                {TAMANHOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {fieldErrors?.tamanhoCamiseta && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.tamanhoCamiseta.message}</p>
              )}
            </div>
          </div>
        )
      })}

      {fields.length < 5 && (
        <button
          type="button"
          onClick={() => append(emptyInscrito(''))}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-secondary/50 hover:text-secondary transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Adicionar outro inscrito
        </button>
      )}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
        <Button type="submit" size="lg" disabled={!isValid}>
          Continuar
        </Button>
      </div>
    </form>
  )
}
