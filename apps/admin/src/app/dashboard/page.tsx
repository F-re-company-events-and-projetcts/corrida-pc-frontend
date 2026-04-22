export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <a
            href="/logout"
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Sair
          </a>
        </div>
        <p className="text-gray-600">Painel administrativo — Corrida do Policial Civil.</p>
      </div>
    </div>
  );
}
