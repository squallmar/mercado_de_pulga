'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    try {
      // TODO: Implementar API para buscar favoritos do usuário
      // Simulando dados por enquanto
      const mockFavorites: Product[] = [
        {
          id: '1',
          title: 'Máquina de Escrever Vintage',
          description: 'Máquina de escrever antiga, funcionando perfeitamente.',
          price: 320.00,
          condition: 'usado',
          category_id: '3',
          seller_id: 'seller1',
          images: [],
          location: 'Rio de Janeiro, RJ',
          status: 'disponivel',
          created_at: new Date('2024-01-20'),
          updated_at: new Date('2024-01-20')
        },
        {
          id: '2',
          title: 'Luminária Art Déco',
          description: 'Luminária estilo Art Déco, original dos anos 40.',
          price: 680.00,
          condition: 'usado',
          category_id: '1',
          seller_id: 'seller2',
          images: [],
          location: 'São Paulo, SP',
          status: 'disponivel',
          created_at: new Date('2024-01-18'),
          updated_at: new Date('2024-01-18')
        },
        {
          id: '3',
          title: 'Disco Vinil Miles Davis',
          description: 'Kind of Blue - edição original de 1959.',
          price: 450.00,
          condition: 'usado',
          category_id: '2',
          seller_id: 'seller3',
          images: [],
          location: 'Belo Horizonte, MG',
          status: 'disponivel',
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-15')
        }
      ];
      
      setFavorites(mockFavorites);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    fetchFavorites();
  }, [session, status, router, fetchFavorites]);

  const removeFavorite = (productId: string) => {
    if (confirm('Remover este produto dos favoritos?')) {
      setFavorites(favorites.filter(p => p.id !== productId));
      // TODO: Implementar API para remover favorito
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC6] p-4">
        <div className="container mx-auto max-w-6xl">
          <div className="vintage-card p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-[#8B6F47] border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 font-vintage-body text-[#6B4C57]">Carregando favoritos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC6] p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <div>
            <h1 className="font-vintage-title text-3xl mb-2" style={{ color: '#3C3C3C' }}>
              Meus Favoritos
            </h1>
            <p className="font-vintage-body text-[#6B4C57]">
              {favorites.length} {favorites.length === 1 ? 'produto salvo' : 'produtos salvos'}
            </p>
          </div>
          
          <Link href="/products" className="vintage-button">
            🔍 Explorar Produtos
          </Link>
        </div>

        {/* Lista de favoritos */}
        {favorites.length === 0 ? (
          <div className="vintage-card p-12 text-center">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="font-vintage-subtitle text-xl mb-2" style={{ color: '#6B4C57' }}>
              Nenhum favorito ainda
            </h2>
            <p className="font-vintage-body text-[#6B4C57] mb-6">
              Explore nosso catálogo e marque produtos como favoritos para vê-los aqui.
            </p>
            <Link href="/products" className="vintage-button">
              Explorar Produtos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((product) => (
              <div key={product.id} className="vintage-card overflow-hidden group">
                {/* Imagem */}
                <div className="relative aspect-square bg-gradient-to-br from-[#E8DCC6] to-[#F5F1E8] flex items-center justify-center">
                  {product.images && product.images.length > 0 ? (
                    <Image 
                      src={product.images[0]} 
                      alt={product.title}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                      <Image 
                        src={`data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="#E8DCC6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6B4C57" font-size="16" font-family="Arial">Sem Imagem</text></svg>')}`} 
                      alt="Produto sem imagem"
                      width={300}
                      height={300}
                      className="w-full h-full object-cover opacity-70"
                    />
                  )}
                  
                  {/* Botão de remover favorito */}
                  <button
                    onClick={() => removeFavorite(product.id)}
                    className="absolute top-3 right-3 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg"
                  >
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </button>
                  
                  {/* Status do produto */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-vintage-body ${
                      product.status === 'disponivel'
                        ? 'bg-green-100 text-green-800'
                        : product.status === 'vendido'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {product.status === 'disponivel' ? 'Disponível' : 
                       product.status === 'vendido' ? 'Vendido' : 'Pausado'}
                    </span>
                  </div>
                </div>
                
                {/* Detalhes */}
                <div className="p-4">
                  <div className="mb-2">
                    <span className="vintage-tag text-xs">Categoria</span>
                  </div>
                  
                  <h3 className="font-vintage-subtitle text-lg mb-2 text-[#3C3C3C] line-clamp-2">
                    {product.title}
                  </h3>
                  
                  <p className="font-vintage-body text-sm text-[#6B4C57] mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-vintage-title text-xl text-[#8B6F47]">
                      R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-[#6B4C57] font-vintage-body">
                      📍 {product.location}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      href={`/products/${product.id}`}
                      className="flex-1 vintage-button text-center py-2 text-sm"
                    >
                      Ver Detalhes
                    </Link>
                    
                    <button
                      onClick={() => removeFavorite(product.id)}
                      className="px-3 py-2 border-2 border-red-400 text-red-600 rounded-lg hover:bg-red-400 hover:text-white transition-colors text-sm font-vintage-body"
                    >
                      💔
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recomendações */}
        {favorites.length > 0 && (
          <div className="vintage-card p-6 mt-8">
            <h2 className="font-vintage-subtitle text-xl mb-4" style={{ color: '#6B4C57' }}>
              Você também pode gostar
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Link key={i} href="/products" className="border border-[#E8DCC6] rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gradient-to-br from-[#E8DCC6] to-[#F5F1E8] rounded-lg mb-3"></div>
                  <h3 className="font-vintage-subtitle text-[#3C3C3C] mb-1">Produto Recomendado {i}</h3>
                  <p className="font-vintage-body text-[#8B6F47]">R$ {(200 * i).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </Link>
              ))}
            </div>
            
            <div className="text-center mt-6">
              <Link href="/products" className="vintage-button">
                Ver Mais Produtos
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}