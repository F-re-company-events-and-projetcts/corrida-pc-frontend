import { fetchCategorias } from '@/lib/api'
import { SelecionarCategoriaStep } from './SelecionarCategoriaStep'

export default async function InscricaoPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>
}) {
  const [categorias, params] = await Promise.all([fetchCategorias(), searchParams])
  return <SelecionarCategoriaStep categorias={categorias} initialCategoriaId={params.cat} />
}
