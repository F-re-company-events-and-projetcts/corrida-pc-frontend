import type { ReactNode } from 'react'
import { InscricaoProvider } from '@/contexts/InscricaoContext'
import { StepProgressBar } from './StepProgressBar'

export const metadata = {
  title: 'Inscrição — 2ª Corrida do Policial Civil',
}

export default function InscricaoLayout({ children }: { children: ReactNode }) {
  return (
    <InscricaoProvider>
      <div className="min-h-screen bg-gray-50">
        <StepProgressBar />
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          {children}
        </main>
      </div>
    </InscricaoProvider>
  )
}
