'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { Categoria } from '@corrida/types'
import { useInscricao } from '@/contexts/InscricaoContext'
import { Button } from '@/components/atoms/button'
import { Typography } from '@/components/atoms/typography'
import { Badge } from '@/components/atoms/badge'
import { cn } from '@/lib/utils'

interface Props {
  categorias: Categoria[]
}

export function SelecionarCategoriaStep({ categorias }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { categoriaId, setCategoriaId } = useInscricao()

  // Auto-selecionar categoria vinda da landing page via ?cat=ID
  useEffect(() => {
    const catParam = searchParams.get('cat')
    if (catParam && !categoriaId) {
      const encontrada = categorias.find((c) => c.id === catParam && c.vagasDisponiveis > 0)
      if (encontrada) setCategoriaId(encontrada.id)
    }
  }, [searchParams, categorias, categoriaId, setCategoriaId])

  const selected = categorias.find((c) => c.id === categoriaId)
  const isPolicial = selected?.tipo === 'POLICIAL'

  function handleSelect(cat: Categoria) {
    if (cat.vagasDisponiveis === 0) return
    setCategoriaId(cat.id)
  }

  function handleContinuar() {
    if (!categoriaId) return
    router.push('/inscricao/dados')
  }

  return (
    <div className="space-y-6">
      <div>
        <Typography variant="h2" as="h1">
          Escolha sua categoria
        </Typography>
        <Typography variant="p" className="mt-1">
          Selecione o percurso e o tipo de inscrição.
        </Typography>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categorias.map((cat) => {
          const esgotada = cat.vagasDisponiveis === 0
          const selecionada = categoriaId === cat.id
          const policial = cat.tipo === 'POLICIAL'

          return (
            <button
              key={cat.id}
              type="button"
              disabled={esgotada}
              onClick={() => handleSelect(cat)}
              className={cn(
                'relative rounded-2xl p-5 border-2 text-left transition-all duration-200 w-full',
                esgotada
                  ? 'opacity-50 bg-gray-100 border-gray-200 cursor-not-allowed'
                  : selecionada
                    ? 'bg-white border-secondary shadow-lg shadow-secondary/10 ring-2 ring-secondary/20'
                    : 'bg-white border-gray-200 hover:border-secondary/50 hover:shadow-md cursor-pointer'
              )}
            >
              {esgotada && (
                <span className="absolute top-3 right-3 text-xs font-black bg-gray-400 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Esgotado
                </span>
              )}
              {selecionada && !esgotada && (
                <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-secondary" />
              )}

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0',
                    policial ? 'bg-secondary text-white' : 'bg-primary/10 text-primary'
                  )}
                >
                  {cat.percursoKm}K
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('font-black text-base', esgotada ? 'text-gray-400' : 'text-secondary')}>
                    {cat.nome}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={policial ? 'secondary' : 'default'} className="text-[10px]">
                      {policial ? 'Policial' : 'Cidadão'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {cat.percursoKm} km
                    </Badge>
                  </div>
                  <div className="mt-2">
                    {cat.precoAtual !== null ? (
                      <span className={cn('text-2xl font-black', esgotada ? 'text-gray-400' : 'text-primary')}>
                        R$ {cat.precoAtual.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Lote indisponível</span>
                    )}
                  </div>
                  {/* vagas disponíveis ocultadas intencionalmente */}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {isPolicial && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 font-medium">
            Comprovação de vínculo funcional será feita presencialmente no check-in.
            Tenha em mãos sua identidade funcional ou contracheque.
          </p>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleContinuar}
          disabled={!categoriaId}
          size="lg"
        >
          Continuar
        </Button>
      </div>
    </div>
  )
}
