import Link from 'next/link'

export function PublicPageHeader() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
      <div className="container mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.jpeg" alt="Logo" className="h-9 w-9 object-contain rounded-lg" />
          <span className="text-sm font-bold text-secondary hidden sm:block leading-tight">
            2ª Corrida do<br />Policial Civil
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/consultar-inscricao"
            className="text-gray-600 hover:text-gray-900 transition-colors hidden sm:block"
          >
            Consultar inscrição
          </Link>
          <Link
            href="/inscricao"
            className="bg-primary text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm"
          >
            Inscrever-se
          </Link>
        </nav>
      </div>
    </header>
  )
}
