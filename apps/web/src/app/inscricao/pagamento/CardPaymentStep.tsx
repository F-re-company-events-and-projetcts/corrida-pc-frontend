'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useInscricao } from '@/contexts/InscricaoContext'
import { Button } from '@/components/atoms/button'
import { Typography } from '@/components/atoms/typography'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? ''

// ─── Minimal MercadoPago.js v2 type declarations ─────────────────────────────

declare global {
  interface Window {
    MercadoPago: new (
      publicKey: string,
      options?: { locale?: string }
    ) => MPInstance
  }
}

interface MPInstance {
  cardForm: (config: MPCardFormConfig) => MPCardFormInstance
}

interface MPCardFormData {
  token: string
  paymentMethodId: string
  issuerId: string
  installments: number
  identificationNumber: string
  identificationType: string
}

interface MPCardFormInstance {
  getCardFormData: () => MPCardFormData
  unmount: () => void
}

interface MPCardFormConfig {
  amount: string
  iframe?: boolean
  form: {
    id: string
    cardNumber: { id: string; placeholder?: string }
    expirationDate: { id: string; placeholder?: string }
    securityCode: { id: string; placeholder?: string }
    cardholderName: { id: string; placeholder?: string }
    issuer: { id: string; placeholder?: string }
    installments: { id: string; placeholder?: string }
    identificationType: { id: string; placeholder?: string }
    identificationNumber: { id: string; placeholder?: string }
  }
  callbacks: {
    onFormMounted?: (error: Error | null) => void
    onSubmit?: (event: Event) => Promise<void>
    onFetching?: (resource: string) => void
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'processing' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

interface CardPaymentStepProps {
  pedidoId: string
  total: number
}

export function CardPaymentStep({ pedidoId, total }: CardPaymentStepProps) {
  const router = useRouter()
  const { inscricoes } = useInscricao()

  const cardFormRef = useRef<MPCardFormInstance | null>(null)
  // Stable refs so the cardForm onSubmit closure never goes stale
  const inscricoesRef = useRef(inscricoes)
  const submitStateRef = useRef<SubmitState>({ kind: 'idle' })

  const [sdkState, setSdkState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' })

  // Keep inscricoesRef in sync without re-initialising the card form
  useEffect(() => {
    inscricoesRef.current = inscricoes
  }, [inscricoes])

  // Step 1: load MercadoPago.js via script tag
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (typeof window.MercadoPago !== 'undefined') {
      setSdkState('ready')
      return
    }

    const script = document.createElement('script')
    script.src = 'https://sdk.mercadopago.com/js/v2'
    script.onload = () => setSdkState('ready')
    script.onerror = () => setSdkState('error')
    document.head.appendChild(script)
  }, [])

  // Step 2: initialise cardForm once SDK is ready
  useEffect(() => {
    if (sdkState !== 'ready' || !MP_PUBLIC_KEY) return
    if (cardFormRef.current) return

    const mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' })

    const handleSubmit = async (event: Event) => {
      event.preventDefault()

      // Prevent double-submit
      if (submitStateRef.current.kind === 'processing') return
      const next: SubmitState = { kind: 'processing' }
      submitStateRef.current = next
      setSubmitState(next)

      const formData = cardFormRef.current?.getCardFormData()
      if (!formData?.token) {
        const err: SubmitState = {
          kind: 'error',
          message: 'Não foi possível obter o token do cartão. Tente novamente.',
        }
        submitStateRef.current = err
        setSubmitState(err)
        return
      }

      const { token, paymentMethodId, issuerId, installments } = formData

      try {
        const res = await fetch(`${API_URL}/api/v1/inscricao/${pedidoId}/cartao`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            installments,
            issuerId: issuerId || undefined,
            paymentMethodId,
            inscricoes: inscricoesRef.current,
          }),
        })

        if (res.ok) {
          const success: SubmitState = { kind: 'success' }
          submitStateRef.current = success
          setSubmitState(success)
          router.push('/inscricao/confirmacao')
          return
        }

        const body = await res.json().catch(() => ({})) as { error?: string }
        const err: SubmitState = {
          kind: 'error',
          message: body.error ?? 'Pagamento recusado. Tente novamente.',
        }
        submitStateRef.current = err
        setSubmitState(err)
      } catch {
        const err: SubmitState = {
          kind: 'error',
          message: 'Erro de conexão. Verifique sua internet e tente novamente.',
        }
        submitStateRef.current = err
        setSubmitState(err)
      }
    }

    cardFormRef.current = mp.cardForm({
      amount: total.toFixed(2),
      iframe: true,
      form: {
        id: 'form-checkout',
        cardNumber: { id: 'form-checkout__cardNumber', placeholder: 'Número do cartão' },
        expirationDate: { id: 'form-checkout__expirationDate', placeholder: 'MM/AA' },
        securityCode: { id: 'form-checkout__securityCode', placeholder: 'CVC' },
        cardholderName: { id: 'form-checkout__cardholderName', placeholder: 'Nome no cartão' },
        issuer: { id: 'form-checkout__issuer', placeholder: 'Banco emissor' },
        installments: { id: 'form-checkout__installments', placeholder: 'Parcelas' },
        identificationType: {
          id: 'form-checkout__identificationType',
          placeholder: 'Tipo de documento',
        },
        identificationNumber: {
          id: 'form-checkout__identificationNumber',
          placeholder: 'CPF (somente números)',
        },
      },
      callbacks: {
        onFormMounted: (error) => {
          if (error) console.error('[MP cardForm] mount error:', error)
        },
        onSubmit: handleSubmit,
        onFetching: () => undefined,
      },
    })

    return () => {
      try {
        cardFormRef.current?.unmount()
      } catch {
        // ignore unmount errors on cleanup
      }
      cardFormRef.current = null
    }
  }, [sdkState, pedidoId, total, router])

  // ─── Error state: SDK failed to load ────────────────────────────────────────
  if (sdkState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="space-y-2">
          <Typography variant="h2" as="h1">
            Erro ao carregar formulário
          </Typography>
          <Typography variant="p" className="text-gray-500">
            Não foi possível carregar o formulário de pagamento. Verifique sua conexão e
            recarregue a página.
          </Typography>
        </div>
        <Button onClick={() => window.location.reload()}>Recarregar página</Button>
      </div>
    )
  }

  const isProcessing =
    submitState.kind === 'processing' || submitState.kind === 'success'

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <Typography variant="h2" as="h1">
          Pagamento com Cartão
        </Typography>
        <Typography variant="p" className="text-gray-500">
          Preencha os dados do cartão. Suas informações são protegidas pelo Mercado Pago.
        </Typography>
      </div>

      {/* SDK loading indicator shown above the (hidden) form */}
      {sdkState === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-12">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          <Typography variant="p" className="text-sm text-gray-500">
            Carregando formulário seguro…
          </Typography>
        </div>
      )}

      {/*
        The form is always rendered so the SDK can mount iframes into its divs.
        We hide it while the SDK is still loading.
      */}
      <form
        id="form-checkout"
        className={sdkState === 'ready' ? 'space-y-4' : 'hidden'}
      >
        {/* Secure iframe fields injected by MercadoPago.js */}
        <div className="space-y-3">
          <div
            id="form-checkout__cardNumber"
            className="rounded-md border border-gray-200 bg-white min-h-[42px] overflow-hidden"
          />
          <div className="grid grid-cols-2 gap-3">
            <div
              id="form-checkout__expirationDate"
              className="rounded-md border border-gray-200 bg-white min-h-[42px] overflow-hidden"
            />
            <div
              id="form-checkout__securityCode"
              className="rounded-md border border-gray-200 bg-white min-h-[42px] overflow-hidden"
            />
          </div>
          <div
            id="form-checkout__cardholderName"
            className="rounded-md border border-gray-200 bg-white min-h-[42px] overflow-hidden"
          />
          <div
            id="form-checkout__issuer"
            className="rounded-md border border-gray-200 bg-white min-h-[42px] overflow-hidden"
          />
          <div
            id="form-checkout__installments"
            className="rounded-md border border-gray-200 bg-white min-h-[42px] overflow-hidden"
          />
          <div className="grid grid-cols-2 gap-3">
            <div
              id="form-checkout__identificationType"
              className="rounded-md border border-gray-200 bg-white min-h-[42px] overflow-hidden"
            />
            <div
              id="form-checkout__identificationNumber"
              className="rounded-md border border-gray-200 bg-white min-h-[42px] overflow-hidden"
            />
          </div>
        </div>

        {/* Rejection error message */}
        {submitState.kind === 'error' && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <Typography variant="p" className="text-sm text-red-700">
              {submitState.message}
            </Typography>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isProcessing}>
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processando…
            </span>
          ) : (
            `Pagar R$ ${total.toFixed(2).replace('.', ',')}`
          )}
        </Button>
      </form>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <Typography variant="p" className="text-sm text-blue-800">
          O pagamento é processado com segurança pelo Mercado Pago. Seus dados de cartão
          nunca são armazenados em nossos servidores.
        </Typography>
      </div>
    </div>
  )
}
