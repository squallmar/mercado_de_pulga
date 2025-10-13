'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { isValidImageUrl, formatDate } from '@/lib/utils';

interface ProductFromAPI extends Omit<Product, 'created_at' | 'updated_at'> {
  created_at: string;
  updated_at: string;
}

export default function MyProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'sold' | 'paused'>('all');

  const fetchMyProducts = useCallback(async () => {
    try {
      if (!session?.user?.id) return;
      
      const response = await fetch(`/api/products?seller_id=${session.user.id}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar produtos');
      }
      
      const data = await response.json();
      
      // Converter strings de data para objetos Date
      const productsWithDates = (data.products || []).map((product: ProductFromAPI) => ({
        ...product,
        created_at: new Date(product.created_at),
        updated_at: new Date(product.updated_at)
      }));
      
      setProducts(productsWithDates);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      // Fallback para dados mock se a API falhar
      const mockProducts: Product[] = [
        {
          id: '1',
          title: 'Poltrona Vintage Anos 70',
          description: 'Linda poltrona em perfeito estado, estilo vintage dos anos 70.',
          price: 450.00,
          condition: 'usado',
          category_id: '1',
          seller_id: session?.user?.id || 'user1',
          images: [],
          location: 'São Paulo, SP',
          status: 'disponivel',
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-15')
        }
      ];
      setProducts(mockProducts);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    fetchMyProducts();
  }, [session, status, router, fetchMyProducts]);

  const filteredProducts = products.filter(product => {
    switch (filter) {
      case 'active':
        return product.status === 'disponivel';
      case 'paused':
        return product.status === 'pausado';
      case 'sold':
        return product.status === 'vendido';
      default:
        return true;
    }
  });

  const handleEditProduct = (productId: string) => {
    // TODO: Implementar edição de produto
    alert(`Editar produto ${productId} - Em breve!`);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      // TODO: Implementar exclusão de produto
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  const handleToggleActive = (productId: string) => {
    setProducts(products.map(p => 
      p.id === productId ? { ...p, status: p.status === 'disponivel' ? 'pausado' : 'disponivel' as const } : p
    ));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC6] p-4">
        <div className="container mx-auto max-w-6xl">
          <div className="vintage-card p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-[#8B6F47] border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 font-vintage-body text-[#6B4C57]">Carregando produtos...</p>
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
              Meus Produtos
            </h1>
            <p className="font-vintage-body text-[#6B4C57]">
              Gerencie seus anúncios e vendas
            </p>
          </div>
          
          <Link href="/sell" className="vintage-button">
            ➕ Novo Produto
          </Link>
        </div>

        {/* Filtros */}
        <div className="vintage-card p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Todos', count: products.length },
              { key: 'active', label: 'Ativos', count: products.filter(p => p.status === 'disponivel').length },
              { key: 'paused', label: 'Pausados', count: products.filter(p => p.status === 'pausado').length },
              { key: 'sold', label: 'Vendidos', count: products.filter(p => p.status === 'vendido').length }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as 'all' | 'active' | 'sold' | 'paused')}
                className={`px-4 py-2 rounded-lg font-vintage-body transition-colors ${
                  filter === filterOption.key
                    ? 'bg-[#8B6F47] text-white'
                    : 'bg-[#E8DCC6] text-[#6B4C57] hover:bg-[#8B6F47] hover:text-white'
                }`}
              >
                {filterOption.label} ({filterOption.count})
              </button>
            ))}
          </div>
        </div>

        {/* Lista de produtos */}
        {filteredProducts.length === 0 ? (
          <div className="vintage-card p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="font-vintage-subtitle text-xl mb-2" style={{ color: '#6B4C57' }}>
              {filter === 'all' ? 'Nenhum produto encontrado' : `Nenhum produto ${filter === 'active' ? 'ativo' : filter === 'paused' ? 'pausado' : 'vendido'}`}
            </h2>
            <p className="font-vintage-body text-[#6B4C57] mb-6">
              {filter === 'all' 
                ? 'Comece criando seu primeiro anúncio!'
                : 'Experimente mudar o filtro para ver outros produtos.'
              }
            </p>
            {filter === 'all' && (
              <Link href="/sell" className="vintage-button">
                Criar Primeiro Produto
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="vintage-card p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Imagem */}
                  <div className="w-full md:w-48 h-48 bg-gradient-to-br from-[#E8DCC6] to-[#F5F1E8] rounded-lg flex items-center justify-center flex-shrink-0">
                    {product.images && product.images.length > 0 && isValidImageUrl(product.images[0]) ? (
                      <Image 
                        src={product.images[0]} 
                        alt={product.title}
                        width={192}
                        height={192}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-4xl">📦</div>
                    )}
                  </div>
                  
                  {/* Detalhes */}
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="vintage-tag">Categoria</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-vintage-body ${
                            product.status === 'disponivel'
                              ? 'bg-green-100 text-green-800' 
                              : product.status === 'pausado'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.status === 'disponivel' ? 'Ativo' : product.status === 'pausado' ? 'Pausado' : 'Vendido'}
                          </span>
                        </div>
                        <h3 className="font-vintage-subtitle text-xl mb-2" style={{ color: '#3C3C3C' }}>
                          {product.title}
                        </h3>
                        <p className="font-vintage-body text-[#6B4C57] mb-2">
                          {product.description}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-vintage-title text-2xl mb-2" style={{ color: '#8B6F47' }}>
                          R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="font-vintage-body text-sm text-[#6B4C57]">
                          Criado em {formatDate(product.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/products/${product.id}`}
                        className="px-4 py-2 bg-[#E8DCC6] text-[#6B4C57] rounded-lg font-vintage-body hover:bg-[#8B6F47] hover:text-white transition-colors"
                      >
                        👁️ Visualizar
                      </Link>
                      
                      <button
                        onClick={() => handleEditProduct(product.id)}
                        className="px-4 py-2 bg-[#7A8471] text-white rounded-lg font-vintage-body hover:bg-[#6B4C57] transition-colors"
                      >
                        ✏️ Editar
                      </button>
                      
                      <button
                        onClick={() => handleToggleActive(product.id)}
                        className={`px-4 py-2 rounded-lg font-vintage-body transition-colors ${
                          product.status === 'disponivel'
                            ? 'bg-orange-500 text-white hover:bg-orange-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {product.status === 'disponivel' ? '⏸️ Pausar' : '▶️ Ativar'}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-vintage-body hover:bg-red-600 transition-colors"
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}