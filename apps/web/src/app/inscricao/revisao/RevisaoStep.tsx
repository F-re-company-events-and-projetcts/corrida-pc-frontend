'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import type { Categoria } from '@corrida/types'
import { useInscricao } from '@/contexts/InscricaoContext'
import { Button } from '@/components/atoms/button'
import { Checkbox } from '@/components/atoms/checkbox'
import { Typography } from '@/components/atoms/typography'
import { cn } from '@/lib/utils'

interface Props {
  categorias: Categoria[]
}

export function RevisaoStep({ categorias }: Props) {
  const router = useRouter()
  const { inscricoes, metodoPagamento, setMetodoPagamento } = useInscricao()

  const [aceitaRegulamento, setAceitaRegulamento] = useState(false)
  const [aceitaLGPD, setAceitaLGPD] = useState(false)
  const [aceitaReembolso, setAceitaReembolso] = useState(false)
  const [declaraPolicial, setDeclaraPolicial] = useState(false)

  const categoriaMap = Object.fromEntries(categorias.map((c) => [c.id, c]))

  const temPolicial = inscricoes.some((i) => categoriaMap[i.categoriaId]?.tipo === 'POLICIAL')

  const total = inscricoes.reduce((sum, i) => {
    const cat = categoriaMap[i.categoriaId]
    return sum + (cat?.precoAtual ?? 0)
  }, 0)

  const podeAvancar =
    aceitaRegulamento && aceitaLGPD && aceitaReembolso && (!temPolicial || declaraPolicial) && metodoPagamento !== null

  return (
    <div className="space-y-8">
      <div>
        <Typography variant="h2" as="h1">
          Revisão do pedido
        </Typography>
        <Typography variant="p" className="mt-1">
          Confira os dados antes de pagar.
        </Typography>
      </div>

      <div className="space-y-4">
        {inscricoes.map((inscrito, idx) => {
          const cat = categoriaMap[inscrito.categoriaId]
          return (
            <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Typography variant="h3" as="h2">
                    {inscrito.nome}
                  </Typography>
                  <p className="text-sm text-gray-500">{cat?.nome ?? inscrito.categoriaId}</p>
                  <p className="text-sm text-gray-500">Camiseta: {inscrito.tamanhoCamiseta}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-secondary text-lg">
                    {cat?.precoAtual != null ? `R$ ${cat.precoAtual.toFixed(2)}` : '—'}
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/inscricao/dados')}
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Editar
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 flex justify-between items-center">
        <Typography variant="h3" as="p">
          Total
        </Typography>
        <Typography variant="h2" as="p">
          R$ {total.toFixed(2)}
        </Typography>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <Typography variant="h3" as="h2">
          Método de pagamento
        </Typography>
        <div className="grid grid-cols-2 gap-3">
          {(['PIX', 'CARTAO'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetodoPagamento(m)}
              className={cn(
                'py-4 px-4 rounded-xl border-2 font-semibold text-sm uppercase tracking-wide transition-all',
                metodoPagamento === m
                  ? 'border-secondary bg-secondary/10 text-secondary'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              )}
            >
              {m === 'PIX' ? 'PIX' : 'Cartão de crédito'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="regulamento"
            checked={aceitaRegulamento}
            onCheckedChange={(v) => setAceitaRegulamento(v === true)}
          />
          <label htmlFor="regulamento" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
            Li e aceito o{' '}
            <a
              href="#regulamento"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              regulamento
            </a>{' '}
            da 2ª Corrida do Policial Civil.
          </label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="lgpd"
            checked={aceitaLGPD}
            onCheckedChange={(v) => setAceitaLGPD(v === true)}
          />
          <label htmlFor="lgpd" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
            Declaro que li e aceito a{' '}
            <a href="#privacidade" className="text-primary underline">
              Política de Privacidade
            </a>{' '}
            e autorizo o tratamento dos meus dados pessoais para fins de inscrição, conforme a LGPD (Lei 13.709/2018).
          </label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="reembolso"
            checked={aceitaReembolso}
            onCheckedChange={(v) => setAceitaReembolso(v === true)}
          />
          <label htmlFor="reembolso" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
            Estou ciente da{' '}
            <a href="#reembolso" className="text-primary underline">
              política de reembolso
            </a>
            : não há reembolso após a confirmação do pagamento, exceto em caso de cancelamento do evento pela organização.
          </label>
        </div>

        {temPolicial && (
          <div className="flex items-start gap-3">
            <Checkbox
              id="declaracao-policial"
              checked={declaraPolicial}
              onCheckedChange={(v) => setDeclaraPolicial(v === true)}
            />
            <label
              htmlFor="declaracao-policial"
              className="text-sm text-gray-700 cursor-pointer leading-relaxed"
            >
              Declaro ser membro de força de segurança pública e estou ciente que a comprovação do
              vínculo funcional será feita presencialmente no check-in.
            </label>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={!podeAvancar}
          onClick={() => router.push('/inscricao/pagamento')}
        >
          Confirmar e ir para pagamento
        </Button>
      </div>
    </div>
  )
}
