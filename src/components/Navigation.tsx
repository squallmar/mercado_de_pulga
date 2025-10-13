'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

export default function Navigation() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <nav className="sticky top-0 z-50" style={{ 
      background: 'linear-gradient(145deg, #F5F1E8, #E8DCC6)', 
      borderBottom: '2px solid #D4AF37',
      boxShadow: '0 4px 20px rgba(139, 111, 71, 0.15)'
    }}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🏷️</span>
              <span className="font-vintage-title text-xl" style={{ color: '#8B6F47' }}>
                MERCADO DE PULGA
              </span>
            </Link>
          </div>

          {/* Barra de busca central */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Buscar tesouros..."
                className="vintage-input w-full pl-12 pr-4 py-2"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5" style={{ color: '#8B6F47' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Menu principal */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/products" 
              className="font-vintage-subtitle transition-colors hover:scale-105"
              style={{ color: '#6B4C57' }}
            >
              Explorar
            </Link>
            
            <Link 
              href="/categories" 
              className="font-vintage-subtitle transition-colors hover:scale-105"
              style={{ color: '#6B4C57' }}
            >
              Categorias
            </Link>

            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: '#E8DCC6' }}></div>
            ) : session ? (
              <>
                <Link 
                  href="/sell" 
                  className="vintage-button px-4 py-2 text-sm"
                >
                  Vender
                </Link>
                
                <div className="relative">
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="flex items-center space-x-2 transition-colors hover:scale-105"
                      style={{ color: '#6B4C57' }}
                  >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #8B6F47, #B4735C)' }}>
                      <span className="text-white text-sm font-medium">
                        {session.user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 vintage-card py-1 z-50">
                        <div className="px-4 py-2 text-sm border-b" style={{ borderColor: '#E8DCC6', color: '#3C3C3C' }}>
                          <div className="font-vintage-subtitle font-medium">{session.user?.name}</div>
                          <div className="font-vintage-body" style={{ color: '#6B4C57' }}>{session.user?.email}</div>
                      </div>
                      
                      <Link 
                        href="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Meu Perfil
                      </Link>
                      
                      <Link 
                        href="/my-products" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Meus Produtos
                      </Link>
                      
                      <Link 
                        href="/favorites" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Favoritos
                      </Link>
                      
                      <Link 
                        href="/messages" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Mensagens
                      </Link>
                      
                      <button 
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t"
                      >
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/auth/login" 
                  className="font-vintage-subtitle transition-colors hover:scale-105"
                  style={{ color: '#6B4C57' }}
                >
                  Entrar
                </Link>
                <Link 
                  href="/auth/register" 
                  className="vintage-button px-4 py-2"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>

          {/* Menu mobile */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="transition-colors"
              style={{ color: '#6B4C57' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Menu mobile expandido */}
        {isMenuOpen && (
          <div className="md:hidden py-4" style={{ borderTop: '1px solid #E8DCC6' }}>
            <div className="space-y-2">
              <Link 
                href="/products" 
                className="block px-4 py-2 rounded font-vintage-body"
                style={{ color: '#6B4C57' }}
                onClick={() => setIsMenuOpen(false)}
              >
                Explorar Produtos
              </Link>
              
              <Link 
                href="/categories" 
                className="block px-4 py-2 rounded font-vintage-body"
                style={{ color: '#6B4C57' }}
                onClick={() => setIsMenuOpen(false)}
              >
                Categorias
              </Link>

              {session ? (
                <>
                  <Link 
                    href="/sell" 
                    className="block px-4 py-2 vintage-button rounded mx-4 text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Vender Produto
                  </Link>
                  
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E8DCC6' }}>
                    <div className="px-4 py-2 text-sm font-vintage-subtitle" style={{ color: '#3C3C3C' }}>
                      <div className="font-medium">{session.user?.name}</div>
                    </div>
                    
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 rounded font-vintage-body"
                      style={{ color: '#6B4C57' }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Meu Perfil
                    </Link>
                    
                    <Link 
                      href="/my-products" 
                      className="block px-4 py-2 rounded font-vintage-body"
                      style={{ color: '#6B4C57' }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Meus Produtos
                    </Link>
                    
                    <button 
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 rounded font-vintage-body"
                      style={{ color: '#6B4C57' }}
                    >
                      Sair
                    </button>
                  </div>
                </>
              ) : (
                <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '1px solid #E8DCC6' }}>
                  <Link 
                    href="/auth/login" 
                    className="block px-4 py-2 rounded font-vintage-body"
                    style={{ color: '#6B4C57' }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Entrar
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="block px-4 py-2 rounded mx-4 text-center vintage-button"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Cadastrar
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}