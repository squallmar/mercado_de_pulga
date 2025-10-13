'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { isValidImageUrl } from '@/lib/utils';

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      const response = await fetch(`/api/products?id=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.products && data.products.length > 0) {
          setProduct(data.products[0]);
        } else {
          setError('Produto não encontrado');
        }
      } else {
        setError('Erro ao carregar produto');
      }
    } catch {
      setError('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id, fetchProduct]);

  const toggleFavorite = async () => {
    if (!session) {
      router.push('/auth/login');
      return;
    }
    
    // TODO: Implementar API de favoritos
    setIsFavorite(!isFavorite);
  };

  const handleContact = () => {
    if (!session) {
      router.push('/auth/login');
      return;
    }
    
    // TODO: Implementar sistema de mensagens
    alert('Sistema de mensagens em breve!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC6] p-4">
        <div className="container mx-auto max-w-6xl">
          <div className="vintage-card p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-[#8B6F47] border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 font-vintage-body text-[#6B4C57]">Carregando produto...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC6] p-4">
        <div className="container mx-auto max-w-6xl">
          <div className="vintage-card p-8 text-center">
            <h1 className="font-vintage-title text-2xl mb-4" style={{ color: '#6B4C57' }}>
              {error || 'Produto não encontrado'}
            </h1>
            <Link href="/products" className="vintage-button">
              Voltar aos Produtos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC6] p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Navegação */}
        <div className="mb-6">
          <Link 
            href="/products" 
            className="inline-flex items-center font-vintage-body text-[#6B4C57] hover:text-[#8B6F47] transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar aos produtos
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Imagens do produto */}
          <div className="vintage-card p-6">
            <div className="aspect-square bg-gradient-to-br from-[#E8DCC6] to-[#F5F1E8] rounded-lg flex items-center justify-center mb-4">
              {product.images && product.images.length > 0 && isValidImageUrl(product.images[0]) ? (
                <Image 
                  src={product.images[0]} 
                  alt={product.title}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="font-vintage-body text-[#6B4C57]">Sem imagem</p>
                </div>
              )}
            </div>
            
            {/* Galeria de imagens (placeholder) */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i}
                  className="aspect-square bg-gradient-to-br from-[#E8DCC6] to-[#F5F1E8] rounded border-2 border-transparent hover:border-[#8B6F47] transition-colors cursor-pointer"
                />
              ))}
            </div>
          </div>

          {/* Detalhes do produto */}
          <div className="space-y-6">
            <div className="vintage-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="vintage-tag">Categoria</span>
                  <h1 className="font-vintage-title text-3xl mt-2 mb-2" style={{ color: '#3C3C3C' }}>
                    {product.title}
                  </h1>
                  <p className="font-vintage-subtitle text-2xl" style={{ color: '#8B6F47' }}>
                    R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                
                <button 
                  onClick={toggleFavorite}
                  className="p-2 rounded-full transition-colors hover:bg-[#E8DCC6]"
                >
                  <svg 
                    className="w-6 h-6" 
                    fill={isFavorite ? "#D4AF37" : "none"} 
                    stroke="#D4AF37" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-vintage-subtitle text-lg mb-2" style={{ color: '#6B4C57' }}>
                    Descrição
                  </h3>
                  <p className="font-vintage-body text-[#3C3C3C] leading-relaxed">
                    {product.description || 'Sem descrição disponível.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-vintage-subtitle text-[#6B4C57]">Condição:</span>
                    <p className="font-vintage-body text-[#3C3C3C]">{product.condition || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="font-vintage-subtitle text-[#6B4C57]">Localização:</span>
                    <p className="font-vintage-body text-[#3C3C3C]">{product.location || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações do vendedor */}
            <div className="vintage-card p-6">
              <h3 className="font-vintage-subtitle text-lg mb-4" style={{ color: '#6B4C57' }}>
                Vendedor
              </h3>
              
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #8B6F47, #B4735C)' }}>
                    <span className="text-white font-vintage-subtitle">
                      V
                    </span>
                  </div>
                  <div>
                    <p className="font-vintage-subtitle text-[#3C3C3C]">Vendedor</p>
                    <p className="font-vintage-body text-sm text-[#6B4C57]">Membro desde 2024</p>
                  </div>
                </div>              <div className="space-y-3">
                <button 
                  onClick={handleContact}
                  className="vintage-button w-full"
                >
                  💬 Entrar em Contato
                </button>
                
                <button className="w-full py-3 px-4 border-2 border-[#8B6F47] text-[#8B6F47] rounded-lg font-vintage-subtitle hover:bg-[#8B6F47] hover:text-white transition-colors">
                  📱 Ver Telefone
                </button>
              </div>
            </div>

            {/* Produtos similares */}
            <div className="vintage-card p-6">
              <h3 className="font-vintage-subtitle text-lg mb-4" style={{ color: '#6B4C57' }}>
                Produtos Similares
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="border border-[#E8DCC6] rounded-lg p-3 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="aspect-square bg-gradient-to-br from-[#E8DCC6] to-[#F5F1E8] rounded mb-2"></div>
                    <p className="font-vintage-body text-sm text-[#3C3C3C] mb-1">Produto Similar {i}</p>
                    <p className="font-vintage-subtitle text-[#8B6F47]">R$ 150,00</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}