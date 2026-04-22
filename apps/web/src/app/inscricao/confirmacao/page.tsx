'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Loader2, AlertCircle, MapPin, Calendar } from 'lucide-react'
import { useInscricao } from '@/contexts/InscricaoContext'
import { Button } from '@/components/atoms/button'
import { Typography } from '@/components/atoms/typography'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface PedidoConfirmado {
  id: string
  total: number
  updatedAt: string
  participantes: { id: string; nome: string; categoria: string }[]
}

type PageState =
  | { kind: 'loading' }
  | { kind: 'ready'; data: PedidoConfirmado }
  | { kind: 'error'; message: string }

export default function ConfirmacaoPage() {
  const router = useRouter()
  const { pedidoId, setCategoriaId, setInscricoes, setMetodoPagamento, setPedidoId } = useInscricao()
  const [state, setState] = useState<PageState>({ kind: 'loading' })

  useEffect(() => {
    if (!pedidoId) {
      router.replace('/inscricao')
      return
    }

    let cancelled = false

    async function fetchPedido() {
      try {
        const res = await fetch(`${API_URL}/api/v1/inscricao/${pedidoId}`)
        if (cancelled) return

        if (!res.ok) {
          setState({ kind: 'error', message: 'Não foi possível carregar os dados da inscrição.' })
          return
        }

        const data = await res.json() as PedidoConfirmado
        if (cancelled) return
        setState({ kind: 'ready', data })

        // Clear context after confirming data is loaded
        setCategoriaId(null)
        setInscricoes([])
        setMetodoPagamento(null)
        setPedidoId(null)
      } catch {
        if (!cancelled) {
          setState({ kind: 'error', message: 'Erro de conexão. Tente recarregar a página.' })
        }
      }
    }

    fetchPedido()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (state.kind === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
        <Typography variant="p" className="text-gray-500">
          Carregando confirmação…
        </Typography>
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="space-y-2">
          <Typography variant="h2" as="h1">Erro ao carregar confirmação</Typography>
          <Typography variant="p" className="text-gray-500">{state.message}</Typography>
        </div>
        <Button onClick={() => router.push('/')}>Voltar ao início</Button>
      </div>
    )
  }

  const { data } = state
  const confirmedAt = new Date(data.updatedAt)
  const formattedDate = confirmedAt.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
  const formattedTime = confirmedAt.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <Typography variant="h2" as="h1">Inscrição confirmada!</Typography>
        <Typography variant="p" className="text-gray-500">
          Pagamento recebido em {formattedDate} às {formattedTime}
        </Typography>
      </div>

      {/* Pedido details */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Typography variant="label" as="p" className="text-xs text-gray-500 uppercase tracking-wide">
            Número do pedido
          </Typography>
          <Typography variant="p" className="font-mono text-sm text-gray-800">
            {data.id}
          </Typography>
        </div>

        <hr className="border-gray-100" />

        <div>
          <Typography variant="label" as="p" className="text-xs text-gray-500 uppercase tracking-wide mb-3">
            Inscritos
          </Typography>
          <ul className="space-y-2">
            {data.participantes.map((p) => (
              <li key={p.id} className="flex items-center justify-between">
                <Typography variant="p" className="text-sm text-gray-800">{p.nome}</Typography>
                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                  {p.categoria}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <hr className="border-gray-100" />

        <div className="flex items-center justify-between">
          <Typography variant="label" as="p" className="text-xs text-gray-500 uppercase tracking-wide">
            Total pago
          </Typography>
          <Typography variant="p" className="font-semibold text-gray-900">
            R$ {data.total.toFixed(2).replace('.', ',')}
          </Typography>
        </div>
      </div>

      {/* Kit pickup info */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-600 shrink-0" />
          <Typography variant="p" className="text-sm font-semibold text-amber-800">
            Retirada do Kit
          </Typography>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <Typography variant="p" className="text-sm text-amber-800">
            Kit disponível em 26/Set/2026 das 08h às 18h na Delegacia de Polícia Civil — Coxim
          </Typography>
        </div>
      </div>

      <Link href={`/pedido/${data.id}`} className="block">
        <Button variant="outline" className="w-full">
          Ver status do pedido
        </Button>
      </Link>

      <Button className="w-full" onClick={() => router.push('/')}>
        Voltar ao início
      </Button>
    </div>
  )
}
