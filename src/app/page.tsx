import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F5F1E8 0%, #E8DCC6 100%)' }}>
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Logo e Título Principal */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <span className="text-5xl mr-3">🏷️</span>
              <h1 className="font-vintage-title text-5xl sm:text-6xl" style={{ color: '#8B6F47' }}>
                MERCADO DE PULGA
              </h1>
            </div>
            <p className="font-vintage-subtitle text-xl" style={{ color: '#6B4C57' }}>
              Onde o passado encontra novos donos
            </p>
          </div>
          
          <h2 className="font-vintage-subtitle text-3xl sm:text-4xl mb-6" style={{ color: '#3C3C3C' }}>
            Garimpe peças com
            <span className="font-vintage-title" style={{ color: '#B4735C' }}> história</span>
          </h2>
          
          <p className="text-lg mb-10 max-w-3xl mx-auto font-vintage-body" style={{ color: '#6B4C57' }}>
            Um brechó digital nostálgico onde cada peça carrega memórias. 
            Encontre tesouros únicos ou dê uma nova vida aos seus achados especiais.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link 
              href="/products" 
              className="vintage-button inline-flex items-center justify-center text-lg font-medium px-8 py-4"
            >
              <span className="mr-2">🔍</span>
              Explorar Achados
            </Link>
            <Link 
              href="/auth/register" 
              className="inline-flex items-center justify-center text-lg font-medium px-8 py-4 border-2 rounded-lg transition-all duration-300 font-vintage-subtitle hover:bg-opacity-10"
              style={{ 
                borderColor: '#8B6F47', 
                color: '#8B6F47',
                background: 'transparent'
              }}
            >
              <span className="mr-2">🧳</span>
              Começar a Vender
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="vintage-card text-center p-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" 
                 style={{ background: 'linear-gradient(145deg, #D4AF37, #B4735C)' }}>
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="font-vintage-subtitle text-xl mb-3" style={{ color: '#3C3C3C' }}>
              Garimpo Inteligente
            </h3>
            <p className="font-vintage-body" style={{ color: '#6B4C57' }}>
              Encontre peças especiais com nossos filtros por época, estilo e história da peça.
            </p>
          </div>
          
          <div className="vintage-card text-center p-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                 style={{ background: 'linear-gradient(145deg, #7A8471, #8B6F47)' }}>
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="font-vintage-subtitle text-xl mb-3" style={{ color: '#3C3C3C' }}>
              Histórias Compartilhadas
            </h3>
            <p className="font-vintage-body" style={{ color: '#6B4C57' }}>
              Converse com vendedores e descubra a história por trás de cada achado especial.
            </p>
          </div>
          
          <div className="vintage-card text-center p-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                 style={{ background: 'linear-gradient(145deg, #6B4C57, #B4735C)' }}>
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="font-vintage-subtitle text-xl mb-3" style={{ color: '#3C3C3C' }}>
              Confiança Vintage
            </h3>
            <p className="font-vintage-body" style={{ color: '#6B4C57' }}>
              Avaliações de colecionadores e perfis verificados para transações seguras.
            </p>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="font-vintage-title text-3xl text-center mb-8" style={{ color: '#8B6F47' }}>
            Baús de Tesouros
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Moda Vintage', icon: '👗', slug: 'moda-beleza', description: 'Roupas com história' },
              { name: 'Casa Retrô', icon: '🏠', slug: 'casa-jardim', description: 'Decoração nostálgica' },
              { name: 'Relíquias Tech', icon: '📱', slug: 'eletronicos', description: 'Gadgets clássicos' },
              { name: 'Esportes Clássicos', icon: '⚽', slug: 'esportes-lazer', description: 'Equipamentos vintage' },
              { name: 'Biblioteca Antiga', icon: '📚', slug: 'livros-revistas', description: 'Livros raros' },
              { name: 'Brinquedos Retrô', icon: '🧸', slug: 'brinquedos-jogos', description: 'Nostalgia infantil' },
              { name: 'Clássicos Automotivos', icon: '🚗', slug: 'automoveis', description: 'Peças e acessórios' },
              { name: 'Música Vintage', icon: '🎵', slug: 'musica-instrumentos', description: 'Vinis e instrumentos' },
            ].map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                className="vintage-card p-6 text-center hover:scale-105 transition-transform duration-300"
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <h4 className="font-vintage-subtitle text-lg mb-2" style={{ color: '#3C3C3C' }}>
                  {category.name}
                </h4>
                <p className="text-sm font-vintage-body" style={{ color: '#6B4C57' }}>
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20" style={{ background: 'linear-gradient(145deg, #8B6F47, #6B4C57)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <span className="text-3xl mr-2">🏷️</span>
              <h3 className="font-vintage-title text-2xl" style={{ color: '#F5F1E8' }}>
                MERCADO DE PULGA
              </h3>
            </div>
            <p className="font-vintage-subtitle text-lg mb-4" style={{ color: '#E8DCC6' }}>
              Onde o passado encontra novos donos
            </p>
            <p className="font-vintage-body" style={{ color: '#E8DCC6' }}>
              Brechó digital nostálgico • Peças com história • Garimpos especiais
            </p>
            <div className="mt-6 text-sm" style={{ color: '#D4AF37' }}>
              © 2025 Mercado de Pulga. Feito com 💛 para colecionadores e garimpeiros.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
