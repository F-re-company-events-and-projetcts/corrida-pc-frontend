import { fetchCategorias } from '@/lib/api'
import { DadosStep } from './DadosStep'

export default async function DadosPage() {
  const categorias = await fetchCategorias()
  return <DadosStep categorias={categorias} />
}
