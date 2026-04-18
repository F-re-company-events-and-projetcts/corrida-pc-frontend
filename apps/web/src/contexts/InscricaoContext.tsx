'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface InscricaoState {
  categoriaId: string | null
  setCategoriaId: (id: string | null) => void
}

const InscricaoContext = createContext<InscricaoState | null>(null)

export function InscricaoProvider({ children }: { children: ReactNode }) {
  const [categoriaId, setCategoriaId] = useState<string | null>(null)

  return (
    <InscricaoContext.Provider value={{ categoriaId, setCategoriaId }}>
      {children}
    </InscricaoContext.Provider>
  )
}

export function useInscricao(): InscricaoState {
  const ctx = useContext(InscricaoContext)
  if (!ctx) throw new Error('useInscricao must be used within InscricaoProvider')
  return ctx
}
