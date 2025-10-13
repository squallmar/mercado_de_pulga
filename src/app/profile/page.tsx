'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserStats {
  totalProducts: number;
  activeProducts: number;
  soldProducts: number;
  totalViews: number;
  joinDate: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats>({
    totalProducts: 0,
    activeProducts: 0,
    soldProducts: 0,
    totalViews: 0,
    joinDate: '2024'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    // Simular carregamento de estatísticas
    setTimeout(() => {
      setStats({
        totalProducts: 12,
        activeProducts: 8,
        soldProducts: 4,
        totalViews: 245,
        joinDate: '2024'
      });
      setLoading(false);
    }, 1000);
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC6] p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="vintage-card p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-[#8B6F47] border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 font-vintage-body text-[#6B4C57]">Carregando perfil...</p>
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
      <div className="container mx-auto max-w-4xl">
        {/* Header do perfil */}
        <div className="vintage-card p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #8B6F47, #B4735C)' }}>
              <span className="text-white text-3xl font-vintage-title">
                {session.user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            
            {/* Informações do usuário */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-vintage-title text-3xl mb-2" style={{ color: '#3C3C3C' }}>
                {session.user?.name}
              </h1>
              <p className="font-vintage-body text-[#6B4C57] mb-4">
                {session.user?.email}
              </p>
              <p className="font-vintage-body text-sm text-[#6B4C57]">
                Membro desde {stats.joinDate}
              </p>
            </div>
            
            {/* Botão de editar */}
            <button className="vintage-button">
              ✏️ Editar Perfil
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="vintage-card p-6 text-center">
            <div className="text-3xl font-vintage-title mb-2" style={{ color: '#8B6F47' }}>
              {stats.totalProducts}
            </div>
            <p className="font-vintage-body text-[#6B4C57]">Total de Produtos</p>
          </div>
          
          <div className="vintage-card p-6 text-center">
            <div className="text-3xl font-vintage-title mb-2" style={{ color: '#B4735C' }}>
              {stats.activeProducts}
            </div>
            <p className="font-vintage-body text-[#6B4C57]">Produtos Ativos</p>
          </div>
          
          <div className="vintage-card p-6 text-center">
            <div className="text-3xl font-vintage-title mb-2" style={{ color: '#7A8471' }}>
              {stats.soldProducts}
            </div>
            <p className="font-vintage-body text-[#6B4C57]">Produtos Vendidos</p>
          </div>
          
          <div className="vintage-card p-6 text-center">
            <div className="text-3xl font-vintage-title mb-2" style={{ color: '#D4AF37' }}>
              {stats.totalViews}
            </div>
            <p className="font-vintage-body text-[#6B4C57]">Total de Views</p>
          </div>
        </div>

        {/* Menu de ações */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Gerenciar produtos */}
          <div className="vintage-card p-6">
            <h2 className="font-vintage-subtitle text-xl mb-4" style={{ color: '#6B4C57' }}>
              Meus Produtos
            </h2>
            
            <div className="space-y-3">
              <Link 
                href="/my-products"
                className="flex items-center justify-between p-3 rounded-lg border border-[#E8DCC6] hover:bg-[#E8DCC6] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📦</span>
                  <span className="font-vintage-body text-[#3C3C3C]">Gerenciar Produtos</span>
                </div>
                <svg className="w-5 h-5 text-[#6B4C57]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              
              <Link 
                href="/sell"
                className="flex items-center justify-between p-3 rounded-lg border border-[#E8DCC6] hover:bg-[#E8DCC6] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">➕</span>
                  <span className="font-vintage-body text-[#3C3C3C]">Adicionar Produto</span>
                </div>
                <svg className="w-5 h-5 text-[#6B4C57]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Atividades */}
          <div className="vintage-card p-6">
            <h2 className="font-vintage-subtitle text-xl mb-4" style={{ color: '#6B4C57' }}>
              Atividades
            </h2>
            
            <div className="space-y-3">
              <Link 
                href="/favorites"
                className="flex items-center justify-between p-3 rounded-lg border border-[#E8DCC6] hover:bg-[#E8DCC6] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">❤️</span>
                  <span className="font-vintage-body text-[#3C3C3C]">Meus Favoritos</span>
                </div>
                <svg className="w-5 h-5 text-[#6B4C57]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              
              <Link 
                href="/messages"
                className="flex items-center justify-between p-3 rounded-lg border border-[#E8DCC6] hover:bg-[#E8DCC6] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💬</span>
                  <span className="font-vintage-body text-[#3C3C3C]">Mensagens</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-[#D4AF37] text-[#3C3C3C] text-xs px-2 py-1 rounded-full font-vintage-body font-medium">3</span>
                  <svg className="w-5 h-5 text-[#6B4C57]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              
              <div className="flex items-center justify-between p-3 rounded-lg border border-[#E8DCC6] hover:bg-[#E8DCC6] transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🔔</span>
                  <span className="font-vintage-body text-[#3C3C3C]">Notificações</span>
                </div>
                <svg className="w-5 h-5 text-[#6B4C57]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Produtos recentes */}
        <div className="vintage-card p-6 mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-vintage-subtitle text-xl" style={{ color: '#6B4C57' }}>
              Produtos Recentes
            </h2>
            <Link 
              href="/my-products"
              className="font-vintage-body text-[#8B6F47] hover:underline"
            >
              Ver todos
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-[#E8DCC6] rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gradient-to-br from-[#E8DCC6] to-[#F5F1E8] rounded-lg mb-3"></div>
                <h3 className="font-vintage-subtitle text-[#3C3C3C] mb-1">Produto {i}</h3>
                <p className="font-vintage-body text-[#8B6F47] mb-2">R$ {(150 * i).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <span className="vintage-tag text-xs">Ativo</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}