'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function diasNoMes(mes: number, ano: number): number {
  if (!mes || !ano) return 31
  return new Date(ano, mes, 0).getDate()
}

interface Props {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  hasError?: boolean
  disabled?: boolean
}

export function DateSelectInput({ value, onChange, hasError, disabled }: Props) {
  const [dia, setDia] = useState('')
  const [mes, setMes] = useState('')
  const [ano, setAno] = useState('')

  // Sincronizar do valor externo para os selects
  useEffect(() => {
    if (value && value.length === 10) {
      const [y, m, d] = value.split('-')
      setAno(y ?? '')
      setMes(m ? String(parseInt(m)) : '')
      setDia(d ? String(parseInt(d)) : '')
    }
  }, []) // só na montagem

  // Emitir valor combinado quando os três estiverem preenchidos
  function emitir(d: string, m: string, y: string) {
    if (d && m && y && y.length === 4) {
      const dd = d.padStart(2, '0')
      const mm = m.padStart(2, '0')
      onChange(`${y}-${mm}-${dd}`)
    } else {
      onChange('')
    }
  }

  const anoAtual = new Date().getFullYear()
  const anos = Array.from({ length: anoAtual - 1899 }, (_, i) => anoAtual - i)
  const maxDias = diasNoMes(parseInt(mes), parseInt(ano))
  const dias = Array.from({ length: maxDias }, (_, i) => i + 1)

  const base = cn(
    'px-3 py-2 rounded-xl border bg-white text-secondary text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
    hasError ? 'border-red-500' : 'border-border',
    disabled && 'opacity-50 cursor-not-allowed'
  )

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Dia */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Dia</label>
        <select
          value={dia}
          disabled={disabled}
          onChange={(e) => { setDia(e.target.value); emitir(e.target.value, mes, ano) }}
          className={cn(base, 'w-full')}
        >
          <option value="">Dia</option>
          {dias.map((d) => (
            <option key={d} value={String(d)}>{String(d).padStart(2, '0')}</option>
          ))}
        </select>
      </div>

      {/* Mês */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Mês</label>
        <select
          value={mes}
          disabled={disabled}
          onChange={(e) => { setMes(e.target.value); emitir(dia, e.target.value, ano) }}
          className={cn(base, 'w-full')}
        >
          <option value="">Mês</option>
          {MESES.map((nome, idx) => (
            <option key={idx + 1} value={String(idx + 1)}>{nome}</option>
          ))}
        </select>
      </div>

      {/* Ano */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Ano</label>
        <select
          value={ano}
          disabled={disabled}
          onChange={(e) => { setAno(e.target.value); emitir(dia, mes, e.target.value) }}
          className={cn(base, 'w-full')}
        >
          <option value="">Ano</option>
          {anos.map((a) => (
            <option key={a} value={String(a)}>{a}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
