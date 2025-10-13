import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center" style={{ background: 'linear-gradient(135deg, #F5F1E8 0%, #E8DCC6 100%)' }}>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full" style={{ background: '#E8DCC6' }}>🧭</div>
          </div>
          <h1 className="font-vintage-title text-5xl mb-3" style={{ color: '#8B6F47' }}>404</h1>
          <p className="font-vintage-subtitle text-xl mb-4" style={{ color: '#3C3C3C' }}>Mapa antigo, rota perdida.</p>
          <p className="font-vintage-body mb-8" style={{ color: '#6B4C57' }}>Não encontramos essa página. Vamos voltar para o garimpo?</p>
          <Link href="/" className="vintage-button px-6 py-3 inline-block">Voltar ao início</Link>
        </div>
      </div>
    </div>
  );
}
