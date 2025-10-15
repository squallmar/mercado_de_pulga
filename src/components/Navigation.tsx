'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function Navigation() {
  const { data: session, status } = useSession();
  // Separate states for desktop user dropdown and mobile menu
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Refs to detect outside clicks
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen, isMobileMenuOpen]);

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
                className="vintage-input w-full pr-4 py-2"
                style={{ paddingLeft: '2.75rem' }}
              />
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
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
                
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
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

                  {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 vintage-card py-1 z-50">
                        <div className="px-4 py-2 text-sm border-b space-y-0.5" style={{ borderColor: '#E8DCC6', color: '#3C3C3C' }}>
                          <div
                            className="font-vintage-subtitle font-medium truncate"
                            title={session.user?.name || undefined}
                          >
                            {session.user?.name}
                          </div>
                          <div
                            className="font-vintage-body truncate"
                            style={{ color: '#6B4C57' }}
                            title={session.user?.email || undefined}
                          >
                            {session.user?.email}
                          </div>
                      </div>
                      
                      <Link 
                        href="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Meu Perfil
                      </Link>
                      
                      <Link 
                        href="/my-products" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Meus Produtos
                      </Link>
                      
                      <Link 
                        href="/favorites" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Favoritos
                      </Link>
                      
                      <Link 
                        href="/messages" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Mensagens
                      </Link>
                      
                      {session.user?.email === 'admin@mercadodepulgas.com' && (
                        <Link 
                          href="/admin" 
                          className="block px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 border-t"
                          onClick={() => setIsUserMenuOpen(false)}
                          style={{ borderColor: '#E8DCC6' }}
                        >
                          🔧 Admin
                        </Link>
                      )}
                      
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
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
        {isMobileMenuOpen && (
          <div className="md:hidden py-4" style={{ borderTop: '1px solid #E8DCC6' }} ref={mobileMenuRef}>
            <div className="space-y-2">
              <Link 
                href="/products" 
                className="block px-4 py-2 rounded font-vintage-body"
                style={{ color: '#6B4C57' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Explorar Produtos
              </Link>
              
              <Link 
                href="/categories" 
                className="block px-4 py-2 rounded font-vintage-body"
                style={{ color: '#6B4C57' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Categorias
              </Link>

              {session ? (
                <>
                  <Link 
                    href="/sell" 
                    className="block px-4 py-2 vintage-button rounded mx-4 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
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
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Meu Perfil
                    </Link>
                    
                    <Link 
                      href="/my-products" 
                      className="block px-4 py-2 rounded font-vintage-body"
                      style={{ color: '#6B4C57' }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Meus Produtos
                    </Link>
                    
                    {session.user?.email === 'admin@mercadodepulgas.com' && (
                      <Link 
                        href="/admin" 
                        className="block px-4 py-2 rounded font-vintage-body text-orange-600"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        🔧 Admin
                      </Link>
                    )}
                    
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
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Entrar
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="block px-4 py-2 rounded mx-4 text-center vintage-button"
                    onClick={() => setIsMobileMenuOpen(false)}
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