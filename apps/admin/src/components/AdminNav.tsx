const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/participantes", label: "Participantes" },
  { href: "/checkin", label: "Check-in" },
  { href: "/lotes", label: "Lotes" },
  { href: "/importar", label: "Importar" },
  { href: "/configuracoes", label: "Configurações" },
];

interface AdminNavProps {
  active?: string;
}

export function AdminNav({ active }: AdminNavProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900 tracking-tight">
          Corrida do Policial Civil
          <span className="ml-2 text-xs font-normal text-gray-400 uppercase tracking-widest">Admin</span>
        </span>
        <nav className="flex items-center gap-1">
          {LINKS.map((link) => {
            const isActive = active === link.href || (active?.startsWith(link.href + "/") && link.href !== "/dashboard");
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </a>
            );
          })}
          <a
            href="/logout"
            className="ml-3 px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            Sair
          </a>
        </nav>
      </div>
    </header>
  );
}
