import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, AlertCircle, Clock, Calendar, MapPin } from 'lucide-react'
import { Typography } from '@/components/atoms/typography'
import { Button } from '@/components/atoms/button'
import { PedidoCountdown } from './PedidoCountdown'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Participante {
  id: string
  nome: string
  categoria: string
}

interface PedidoData {
  id: string
  status: 'AGUARDANDO_PAGAMENTO' | 'PAGO' | 'EXPIRADO' | 'RECUSADO' | 'CANCELADO'
  expiresAt: string | null
  metodoPagamento: 'PIX' | 'CARTAO'
  total: number
  updatedAt: string
  participantes: Participante[]
}

async function fetchPedido(id: string): Promise<PedidoData | null> {
  const res = await fetch(`${API_URL}/api/v1/inscricao/${id}`, {
    cache: 'no-store',
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Falha ao buscar pedido')
  return res.json() as Promise<PedidoData>
}

function StatusBadge({ status }: { status: PedidoData['status'] }) {
  const config: Record<PedidoData['status'], { label: string; className: string }> = {
    AGUARDANDO_PAGAMENTO: { label: 'Aguardando pagamento', className: 'bg-amber-100 text-amber-800' },
    PAGO: { label: 'Pago', className: 'bg-green-100 text-green-800' },
    EXPIRADO: { label: 'Expirado', className: 'bg-gray-100 text-gray-600' },
    RECUSADO: { label: 'Recusado', className: 'bg-red-100 text-red-700' },
    CANCELADO: { label: 'Cancelado', className: 'bg-red-100 text-red-700' },
  }
  const { label, className } = config[status]
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${className}`}>
      {label}
    </span>
  )
}

export default async function PedidoStatusPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const pedido = await fetchPedido(id)

  if (!pedido) notFound()

  const isPix = pedido.metodoPagamento === 'PIX'
  const isAwaitingPix =
    pedido.status === 'AGUARDANDO_PAGAMENTO' && isPix && pedido.expiresAt !== null

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          {pedido.status === 'PAGO' && <CheckCircle className="w-16 h-16 text-green-500" />}
          {pedido.status === 'EXPIRADO' && <AlertCircle className="w-16 h-16 text-gray-400" />}
          {pedido.status === 'AGUARDANDO_PAGAMENTO' && <Clock className="w-16 h-16 text-amber-500" />}
          {(pedido.status === 'RECUSADO' || pedido.status === 'CANCELADO') && (
            <AlertCircle className="w-16 h-16 text-red-500" />
          )}

          <Typography variant="h2" as="h1">Status do Pedido</Typography>
          <StatusBadge status={pedido.status} />
        </div>

        {/* Pedido details */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Typography variant="label" as="p" className="text-xs text-gray-500 uppercase tracking-wide">
              Número do pedido
            </Typography>
            <Typography variant="p" className="font-mono text-sm text-gray-800">
              {pedido.id}
            </Typography>
          </div>

          <hr className="border-gray-100" />

          <div className="flex items-center justify-between">
            <Typography variant="label" as="p" className="text-xs text-gray-500 uppercase tracking-wide">
              Método
            </Typography>
            <Typography variant="p" className="text-sm text-gray-800">
              {pedido.metodoPagamento === 'PIX' ? 'PIX' : 'Cartão de crédito'}
            </Typography>
          </div>

          <hr className="border-gray-100" />

          <div>
            <Typography variant="label" as="p" className="text-xs text-gray-500 uppercase tracking-wide mb-3">
              Inscritos
            </Typography>
            <ul className="space-y-2">
              {pedido.participantes.map((p) => (
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
              Total
            </Typography>
            <Typography variant="p" className="font-semibold text-gray-900">
              R$ {pedido.total.toFixed(2).replace('.', ',')}
            </Typography>
          </div>
        </div>

        {/* Status-specific content */}
        {isAwaitingPix && (
          <div className="flex flex-col items-center gap-3 text-center">
            <PedidoCountdown expiresAt={pedido.expiresAt!} />
          </div>
        )}

        {pedido.status === 'PAGO' && (
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
        )}

        {pedido.status === 'EXPIRADO' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Typography variant="p" className="text-gray-500">
              Este pedido expirou. Realize uma nova inscrição.
            </Typography>
            <Link href="/inscricao">
              <Button>Nova inscrição</Button>
            </Link>
          </div>
        )}

        <Link href="/" className="block">
          <Button variant="outline" className="w-full">Voltar ao início</Button>
        </Link>
      </div>
    </main>
  )
}
