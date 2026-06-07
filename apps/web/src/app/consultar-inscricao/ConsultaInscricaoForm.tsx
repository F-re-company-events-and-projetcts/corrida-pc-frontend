'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle, Clock, Search } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Typography } from '@/components/atoms/typography'
import { PublicPageHeader } from '@/components/organisms/PublicPageHeader'
import { Footer } from '@/components/organisms/Footer'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface ConsultaData {
  numeroPedido: string
  status: 'AGUARDANDO_PAGAMENTO' | 'PAGO' | 'EXPIRADO' | 'RECUSADO' | 'CANCELADO'
  metodoPagamento: 'PIX' | 'CARTAO'
  total: number
  expiresAt: string | null
  updatedAt: string
  participantes: { nome: string; categoria: string; numeroPeito: number | null }[]
}

type PageState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; data: ConsultaData }
  | { kind: 'error'; message: string }

const STATUS_LABELS: Record<ConsultaData['status'], string> = {
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  PAGO: 'Pago',
  EXPIRADO: 'Expirado',
  RECUSADO: 'Recusado',
  CANCELADO: 'Cancelado',
}

const STATUS_COLORS: Record<ConsultaData['status'], string> = {
  AGUARDANDO_PAGAMENTO: 'bg-amber-100 text-amber-800',
  PAGO: 'bg-green-100 text-green-800',
  EXPIRADO: 'bg-gray-100 text-gray-700',
  RECUSADO: 'bg-red-100 text-red-700',
  CANCELADO: 'bg-red-100 text-red-700',
}

function StatusIcon({ status }: { status: ConsultaData['status'] }) {
  if (status === 'PAGO') return <CheckCircle className="w-10 h-10 text-green-500" />
  if (status === 'AGUARDANDO_PAGAMENTO') return <Clock className="w-10 h-10 text-amber-500" />
  return <AlertCircle className="w-10 h-10 text-gray-400" />
}

export function ConsultaInscricaoForm({
  initialNumeroPedido,
}: {
  initialNumeroPedido: string
}) {
  const [numeroPedido, setNumeroPedido] = useState(initialNumeroPedido)
  const [email, setEmail] = useState('')
  const [state, setState] = useState<PageState>({ kind: 'idle' })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState({ kind: 'loading' })

    try {
      const res = await fetch(`${API_URL}/api/v1/consulta-inscricao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeroPedido, email }),
      })

      const body = await res.json().catch(() => ({})) as ConsultaData | { error?: string }
      if (!res.ok) {
        setState({
          kind: 'error',
          message: 'error' in body && body.error ? body.error : 'Não foi possível consultar a inscrição.',
        })
        return
      }

      setState({ kind: 'ready', data: body as ConsultaData })
    } catch {
      setState({ kind: 'error', message: 'Erro de conexão. Tente novamente.' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicPageHeader />
      <main className="flex-1 px-4 py-10">
      <div className="mx-auto max-w-xl space-y-8">
        <div className="text-center space-y-2">
          <Typography variant="h2" as="h1">Consultar inscrição</Typography>
          <Typography variant="p" className="text-gray-500">
            Informe o número do pedido e o e-mail usado na inscrição.
          </Typography>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="space-y-1">
            <label htmlFor="numeroPedido" className="text-sm font-medium text-gray-700">
              Número do pedido
            </label>
            <input
              id="numeroPedido"
              value={numeroPedido}
              onChange={(event) => setNumeroPedido(event.target.value.toUpperCase())}
              placeholder="PC-2026-000001"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <Button type="submit" className="w-full gap-2" disabled={state.kind === 'loading'}>
            <Search className="w-4 h-4" />
            {state.kind === 'loading' ? 'Consultando...' : 'Consultar'}
          </Button>
        </form>

        {state.kind === 'error' && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {state.message}
          </div>
        )}

        {state.kind === 'ready' && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
            <div className="flex items-center gap-3">
              <StatusIcon status={state.data.status} />
              <div>
                <Typography variant="p" className="font-mono text-sm text-gray-500">
                  {state.data.numeroPedido}
                </Typography>
                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${STATUS_COLORS[state.data.status]}`}>
                  {STATUS_LABELS[state.data.status]}
                </span>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Pagamento</p>
                <p className="font-medium text-gray-900">
                  {state.data.metodoPagamento === 'PIX' ? 'PIX' : 'Cartão de crédito'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Total</p>
                <p className="font-medium text-gray-900">
                  R$ {state.data.total.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Inscritos</p>
              <ul className="space-y-2">
                {state.data.participantes.map((participante) => (
                  <li key={`${participante.nome}-${participante.categoria}`} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-gray-900">{participante.nome}</span>
                      <span className="text-xs text-gray-500">{participante.categoria}</span>
                    </div>
                    {participante.numeroPeito ? (
                      <p className="mt-1 text-xs text-gray-500">Número de peito: {participante.numeroPeito}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <Link href="/" className="block">
          <Button variant="outline" className="w-full">Voltar ao início</Button>
        </Link>
      </div>
      </main>
      <Footer />
    </div>
  )
}
