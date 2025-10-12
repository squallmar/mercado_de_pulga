import Link from "next/link";
import Navigation from "@/components/Navigation";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Compre e venda produtos
            <span className="text-indigo-600"> de segunda mão</span>
          </h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            O marketplace brasileiro que conecta pessoas interessadas em dar uma segunda vida aos seus produtos.
            Encontre tesouros únicos ou venda aquilo que não usa mais.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <Link href="/products" className="bg-indigo-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-indigo-700">
              Explorar Produtos
            </Link>
            <Link href="/auth/register" className="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-md text-lg font-medium hover:bg-indigo-50">
              Começar a Vender
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Busca Inteligente</h3>
            <p className="text-gray-600">Encontre exatamente o que procura com nossos filtros avançados e busca por localização.</p>
          </div>
          
          <div className="text-center">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chat Integrado</h3>
            <p className="text-gray-600">Converse diretamente com compradores e vendedores para negociar e tirar dúvidas.</p>
          </div>
          
          <div className="text-center">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Compra Segura</h3>
            <p className="text-gray-600">Sistema de avaliações e perfis verificados para garantir transações seguras.</p>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Categorias Populares</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Moda', icon: '👗', slug: 'moda-beleza' },
              { name: 'Casa', icon: '🏠', slug: 'casa-jardim' },
              { name: 'Eletrônicos', icon: '📱', slug: 'eletronicos' },
              { name: 'Esportes', icon: '⚽', slug: 'esportes-lazer' },
              { name: 'Livros', icon: '📚', slug: 'livros-revistas' },
              { name: 'Brinquedos', icon: '🧸', slug: 'brinquedos-jogos' },
              { name: 'Carros', icon: '🚗', slug: 'automoveis' },
              { name: 'Música', icon: '🎵', slug: 'musica-instrumentos' },
            ].map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
              >
                <div className="text-3xl mb-2">{category.icon}</div>
                <h4 className="font-medium text-gray-900">{category.name}</h4>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">🛍️ Mercado de Pulga</h3>
            <p className="text-gray-400">
              Marketplace brasileiro de produtos de segunda mão
            </p>
            <div className="mt-4 text-sm text-gray-500">
              © 2025 Mercado de Pulga. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
