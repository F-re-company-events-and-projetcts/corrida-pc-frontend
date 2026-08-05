import { fetchCategorias } from '@/lib/api'
import { RevisaoStep } from './RevisaoStep'

export default async function RevisaoPage() {
  const categorias = await fetchCategorias()
  return <RevisaoStep categorias={categorias} />
}
