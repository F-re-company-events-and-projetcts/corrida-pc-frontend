import { fetchCategorias } from '@/lib/api'
import { SelecionarCategoriaStep } from './SelecionarCategoriaStep'

export default async function InscricaoPage() {
  const categorias = await fetchCategorias()
  return <SelecionarCategoriaStep categorias={categorias} />
}
