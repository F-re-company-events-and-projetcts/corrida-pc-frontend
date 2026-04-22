'use client'

import { useEffect, useState } from 'react'
import { Typography } from '@/components/atoms/typography'

export function PedidoCountdown({ expiresAt }: { expiresAt: string }) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  )

  useEffect(() => {
    const tick = () =>
      setSecondsLeft(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const colorClass =
    secondsLeft <= 60
      ? 'bg-red-50 text-red-600'
      : secondsLeft <= 300
      ? 'bg-amber-50 text-amber-600'
      : 'bg-gray-100 text-gray-700'

  return (
    <div className="space-y-3">
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold tabular-nums ${colorClass}`}>
        <span>Expira em</span>
        <span>{formatted}</span>
      </div>
      <Typography variant="p" className="text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
        Aguardando confirmação do pagamento PIX. Não feche esta página.
      </Typography>
    </div>
  )
}
