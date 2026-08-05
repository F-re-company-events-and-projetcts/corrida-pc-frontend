'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const STEPS = [
  { label: 'Categoria', path: '/inscricao' },
  { label: 'Dados', path: '/inscricao/dados' },
  { label: 'Revisão', path: '/inscricao/revisao' },
  { label: 'Pagamento', path: '/inscricao/pagamento' },
  { label: 'Confirmação', path: '/inscricao/confirmacao' },
]

export function StepProgressBar() {
  const pathname = usePathname()

  const currentIndex = STEPS.findLastIndex((s) => pathname.startsWith(s.path))
  const activeIndex = currentIndex === -1 ? 0 : currentIndex

  return (
    <div className="bg-white border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < activeIndex
            const isActive = idx === activeIndex

            return (
              <div key={step.path} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                      isCompleted && 'bg-primary text-white',
                      isActive && 'bg-secondary text-white ring-2 ring-secondary/30',
                      !isCompleted && !isActive && 'bg-gray-100 text-gray-400'
                    )}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-semibold uppercase tracking-wide hidden sm:block',
                      isActive ? 'text-secondary' : isCompleted ? 'text-primary' : 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2 transition-colors',
                      isCompleted ? 'bg-primary' : 'bg-gray-100'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
