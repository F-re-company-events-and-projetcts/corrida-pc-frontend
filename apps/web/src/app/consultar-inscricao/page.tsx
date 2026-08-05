import { ConsultaInscricaoForm } from './ConsultaInscricaoForm'

interface PageProps {
  searchParams: Promise<{ numeroPedido?: string }>
}

export default async function ConsultarInscricaoPage({ searchParams }: PageProps) {
  const params = await searchParams

  return <ConsultaInscricaoForm initialNumeroPedido={params.numeroPedido ?? ''} />
}
