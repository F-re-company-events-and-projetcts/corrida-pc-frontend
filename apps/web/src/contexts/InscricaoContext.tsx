'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { InscricaoInput } from '@corrida/validations'

interface InscricaoState {
  categoriaId: string | null
  setCategoriaId: (id: string | null) => void
  inscricoes: InscricaoInput[]
  setInscricoes: (inscritos: InscricaoInput[]) => void
  metodoPagamento: 'PIX' | 'CARTAO' | null
  setMetodoPagamento: (m: 'PIX' | 'CARTAO') => void
}

const InscricaoContext = createContext<InscricaoState | null>(null)

export function InscricaoProvider({ children }: { children: ReactNode }) {
  const [categoriaId, setCategoriaId] = useState<string | null>(null)
  const [inscricoes, setInscricoes] = useState<InscricaoInput[]>([])
  const [metodoPagamento, setMetodoPagamento] = useState<'PIX' | 'CARTAO' | null>(null)

  return (
    <InscricaoContext.Provider
      value={{ categoriaId, setCategoriaId, inscricoes, setInscricoes, metodoPagamento, setMetodoPagamento }}
    >
      {children}
    </InscricaoContext.Provider>
  )
}

export function useInscricao(): InscricaoState {
  const ctx = useContext(InscricaoContext)
  if (!ctx) throw new Error('useInscricao must be used within InscricaoProvider')
  return ctx
}
