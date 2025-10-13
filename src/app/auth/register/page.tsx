'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validações
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          location: formData.location
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao criar conta');
        return;
      }

      // Auto-login após registro
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Se o auto-login falhar, redirecionar para login
        router.push('/auth/login?message=Conta criada com sucesso! Faça login.');
      } else {
        // Sucesso no auto-login
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Erro interno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(135deg, #F5F1E8 0%, #E8DCC6 100%)' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="font-vintage-title text-3xl" style={{ color: '#8B6F47' }}>Mercado de Pulga</h1>
          <h2 className="mt-6 text-center text-3xl font-vintage-subtitle" style={{ color: '#3C3C3C' }}>Crie sua conta</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link
              href="/auth/login"
              className="font-vintage-body hover:underline"
              style={{ color: '#8B6F47' }}
            >
              entre na sua conta existente
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="vintage-card py-8 px-4 sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="px-4 py-3 rounded-md text-sm" style={{ background: '#FDF2F2', border: '1px solid #FECACA', color: '#991B1B' }}>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-vintage-subtitle" style={{ color: '#3C3C3C' }}>
                Nome completo
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 rounded-md placeholder-gray-500 sm:text-sm vintage-input"
                  placeholder="Seu nome completo"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-vintage-subtitle" style={{ color: '#3C3C3C' }}>
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 rounded-md placeholder-gray-500 sm:text-sm vintage-input"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-vintage-subtitle" style={{ color: '#3C3C3C' }}>
                Telefone (opcional)
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 rounded-md placeholder-gray-500 sm:text-sm vintage-input"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-vintage-subtitle" style={{ color: '#3C3C3C' }}>
                Localização (opcional)
              </label>
              <div className="mt-1">
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 rounded-md placeholder-gray-500 sm:text-sm vintage-input"
                  placeholder="São Paulo, SP"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-vintage-subtitle" style={{ color: '#3C3C3C' }}>
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 rounded-md placeholder-gray-500 sm:text-sm vintage-input"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-vintage-subtitle" style={{ color: '#3C3C3C' }}>
                Confirmar senha
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 rounded-md placeholder-gray-500 sm:text-sm vintage-input"
                  placeholder="Digite a senha novamente"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="agree"
                name="agree"
                type="checkbox"
                required
                className="h-4 w-4 rounded"
              />
              <label htmlFor="agree" className="ml-2 block text-sm font-vintage-body" style={{ color: '#6B4C57' }}>
                Eu aceito os{' '}
                <a href="#" className="hover:underline" style={{ color: '#8B6F47' }}>
                  Termos de Uso
                </a>{' '}
                e a{' '}
                <a href="#" className="hover:underline" style={{ color: '#8B6F47' }}>
                  Política de Privacidade
                </a>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed vintage-button"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Criando conta...
                  </>
                ) : (
                  'Criar conta'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}