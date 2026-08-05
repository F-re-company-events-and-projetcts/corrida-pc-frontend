'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useInscricao } from '@/contexts/InscricaoContext'
import { Button } from '@/components/atoms/button'
import { Typography } from '@/components/atoms/typography'
import { CardPaymentStep } from './CardPaymentStep'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface PixData {
  pedidoId: string
  numeroPedido: string
  qrCode: string
  qrCodeBase64: string
  expiresAt: string
}

interface CartaoData {
  pedidoId: string
  numeroPedido: string
  total: number
}

type PageState =
  | { kind: 'loading' }
  | { kind: 'pix'; data: PixData }
  | { kind: 'card'; data: CartaoData }
  | { kind: 'expired' }
  | { kind: 'error'; message: string }

function getSecondsLeft(expiresAt: string | null) {
  if (!expiresAt) return 0
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
}

function useCountdown(expiresAt: string | null) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => getSecondsLeft(expiresAt))

  useEffect(() => {
    if (!expiresAt) return
    const tick = () => {
      setSecondsLeft(getSecondsLeft(expiresAt))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return { secondsLeft, formatted }
}

export default function PagamentoPage() {
  const router = useRouter()
  const { inscricoes, metodoPagamento, setPedidoId } = useInscricao()
  const [state, setState] = useState<PageState>({ kind: 'loading' })
  const [copied, setCopied] = useState(false)
  const [simulatingPayment, setSimulatingPayment] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const expiredRef = useRef(false)
  const createPedidoStartedRef = useRef(false)
  const activeRef = useRef(false)

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const startPolling = useCallback((pedidoId: string) => {
    stopPolling()
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/inscricao/${pedidoId}`)
        if (!res.ok) return
        const data = await res.json() as { status: string }
        if (data.status === 'PAGO') {
          stopPolling()
          setPedidoId(pedidoId)
          router.push('/inscricao/confirmacao')
        } else if (data.status === 'EXPIRADO' || data.status === 'CANCELADO') {
          stopPolling()
          expiredRef.current = true
          setState({ kind: 'expired' })
        }
      } catch {
        // ignore transient network errors — polling will retry
      }
    }, 3000)
  }, [router, setPedidoId, stopPolling])

  useEffect(() => {
    activeRef.current = true

    if (inscricoes.length === 0 || metodoPagamento === null) {
      router.replace('/inscricao')
      return () => {
        activeRef.current = false
        stopPolling()
      }
    }

    async function criarPedido() {
      try {
        const res = await fetch(`${API_URL}/api/v1/inscricao`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inscricoes, metodoPagamento }),
        })

        if (!activeRef.current) return

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string }
          if (!activeRef.current) return
          setState({ kind: 'error', message: body.error ?? 'Erro ao iniciar pagamento.' })
          return
        }

        const data = await res.json() as PixData | CartaoData

        if (!activeRef.current) return

        if (metodoPagamento === 'CARTAO') {
          setState({ kind: 'card', data: data as CartaoData })
        } else {
          const pixData = data as PixData
          setPedidoId(pixData.pedidoId)
          setState({ kind: 'pix', data: pixData })
          startPolling(pixData.pedidoId)
        }
      } catch {
        if (!activeRef.current) return
        setState({ kind: 'error', message: 'Erro de conexão. Tente novamente.' })
      }
    }

    if (!createPedidoStartedRef.current) {
      createPedidoStartedRef.current = true
      criarPedido()
    }

    return () => {
      activeRef.current = false
      stopPolling()
    }
  }, [inscricoes, metodoPagamento, router, setPedidoId, startPolling, stopPolling])

  const expiresAt = state.kind === 'pix' ? state.data.expiresAt : null
  const { secondsLeft, formatted } = useCountdown(expiresAt)

  useEffect(() => {
    if (!expiresAt || secondsLeft !== 0 || expiredRef.current) return

    const expiresAtMs = new Date(expiresAt).getTime()
    if (Number.isNaN(expiresAtMs) || expiresAtMs > Date.now()) return

    expiredRef.current = true
    stopPolling()
    queueMicrotask(() => setState({ kind: 'expired' }))
  }, [expiresAt, secondsLeft, stopPolling])

  async function copiarCodigo() {
    if (state.kind !== 'pix') return
    try {
      await navigator.clipboard.writeText(state.data.qrCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select the text manually — not critical
    }
  }

  async function simularPagamentoAprovado() {
    if (state.kind !== 'pix' || simulatingPayment) return

    setSimulatingPayment(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/dev/aprovar-pix/${state.data.pedidoId}`, {
        method: 'POST',
        headers: { 'x-dev-payment-secret': 'dev-local' },
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        setState({ kind: 'error', message: body.error ?? 'Erro ao simular pagamento.' })
        return
      }

      stopPolling()
      setPedidoId(state.data.pedidoId)
      router.push('/inscricao/confirmacao')
    } catch {
      setState({ kind: 'error', message: 'Erro ao simular pagamento.' })
    } finally {
      setSimulatingPayment(false)
    }
  }

  // ─── Loading ─────────────────────────────────────────────────────────────────

  if (state.kind === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
        <Typography variant="p" className="text-gray-500">
          {metodoPagamento === 'CARTAO'
            ? 'Preparando pagamento…'
            : 'Gerando QR Code PIX…'}
        </Typography>
      </div>
    )
  }

  // ─── Error ───────────────────────────────────────────────────────────────────

  if (state.kind === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="space-y-2">
          <Typography variant="h2" as="h1">
            Erro ao gerar pagamento
          </Typography>
          <Typography variant="p" className="text-gray-500">
            {state.message}
          </Typography>
        </div>
        <Button onClick={() => router.push('/inscricao')}>Tentar novamente</Button>
      </div>
    )
  }

  // ─── PIX expired ─────────────────────────────────────────────────────────────

  if (state.kind === 'expired') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500" />
        <div className="space-y-2">
          <Typography variant="h2" as="h1">
            PIX expirado
          </Typography>
          <Typography variant="p" className="text-gray-500">
            O tempo para pagamento esgotou. Inicie uma nova inscrição para gerar um novo QR Code.
          </Typography>
        </div>
        <Button onClick={() => router.push('/inscricao')}>Tentar novamente</Button>
      </div>
    )
  }

  // ─── Card payment ─────────────────────────────────────────────────────────────

  if (state.kind === 'card') {
    return (
      <CardPaymentStep
        pedidoId={state.data.pedidoId}
        numeroPedido={state.data.numeroPedido}
        total={state.data.total}
      />
    )
  }

  // ─── PIX ─────────────────────────────────────────────────────────────────────

  const { qrCodeBase64, qrCode } = state.data

  return (
    <div className="space-y-8">
      <div className="text-center space-y-1">
        <Typography variant="h2" as="h1">
          Pague com PIX
        </Typography>
        <Typography variant="p" className="text-gray-500">
          Escaneie o QR Code ou copie o código abaixo.
        </Typography>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${qrCodeBase64}`}
            alt="QR Code PIX"
            width={240}
            height={240}
            className="block"
          />
        </div>

        <div
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold tabular-nums
            ${secondsLeft <= 60
              ? 'bg-red-50 text-red-600'
              : secondsLeft <= 300
              ? 'bg-amber-50 text-amber-600'
              : 'bg-gray-100 text-gray-700'
            }
          `}
        >
          <span>Expira em</span>
          <span>{formatted}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
        <Typography variant="label" as="p" className="text-xs text-gray-500 uppercase tracking-wide">
          Código copia e cola
        </Typography>
        <p className="text-xs font-mono break-all text-gray-700 leading-relaxed">
          {qrCode}
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={copiarCodigo}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-green-600">Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copiar código PIX
            </>
          )}
        </Button>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <Typography variant="p" className="text-sm text-blue-800">
          Após o pagamento ser confirmado você será redirecionado automaticamente. Não feche esta página.
        </Typography>
      </div>

      {process.env.NODE_ENV !== 'production' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <Typography variant="label" as="p" className="text-xs text-amber-700 uppercase tracking-wide">
            Desenvolvimento
          </Typography>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
            onClick={simularPagamentoAprovado}
            disabled={simulatingPayment}
          >
            {simulatingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
            Simular pagamento aprovado
          </Button>
        </div>
      )}
    </div>
  )
}
