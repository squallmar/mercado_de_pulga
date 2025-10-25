'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import EditUserModal from '@/components/EditUserModal';
import { getCsrfToken } from '@/lib/csrf';

interface RecentUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface RecentProduct {
  id: string;
  title: string;
  price: number;
  seller_name: string;
}

interface RecentTransaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalTransactions: number;
  totalRevenue: number;
  recentUsers: RecentUser[];
  recentProducts: RecentProduct[];
  recentTransactions: RecentTransaction[];
}

interface User {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  created_at: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  status: string;
  seller_name: string;
  created_at: string;
}

interface Transaction {
  id: string;
  product_title: string;
  amount: number;
  platform_fee: number;
  status: string;
  created_at: string;
}

type AdminTabType = 'overview' | 'users' | 'products' | 'transactions';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTabType>('overview');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.role || session.user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchAdminStats();
  }, [session, status, router]);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC6] flex items-center justify-center">
        <div className="vintage-card p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-[#8B6F47] border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 font-vintage-body text-[#6B4C57]">Carregando painel admin...</p>
        </div>
      </div>
    );
  }

  if (!session?.user?.role || session.user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC6] p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="vintage-card p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-vintage-title text-3xl mb-2" style={{ color: '#3C3C3C' }}>
                🔧 Painel Administrativo
              </h1>
              <p className="font-vintage-body text-[#6B4C57]">
                Gerencie usuários, produtos e transações do Mercado de Pulgas
              </p>
            </div>
            <Link href="/" className="vintage-button">
              ← Voltar ao Site
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="vintage-card p-6 mb-6">
          <div className="flex space-x-4">
            {[
              { key: 'overview', label: '📊 Visão Geral' },
              { key: 'users', label: '👥 Usuários' },
              { key: 'products', label: '📦 Produtos' },
              { key: 'transactions', label: '💰 Transações' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as AdminTabType)}
                className={`px-4 py-2 rounded-lg font-vintage-subtitle transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[#8B6F47] text-white'
                    : 'bg-[#E8DCC6] text-[#6B4C57] hover:bg-[#D4C4A8]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <OverviewTab stats={stats} />
        )}
        
        {activeTab === 'users' && (
          <UsersTab />
        )}
        
        {activeTab === 'products' && (
          <ProductsTab />
        )}
        
        {activeTab === 'transactions' && (
          <TransactionsTab />
        )}
      </div>
    </div>
  );
}

function OverviewTab({ stats }: { stats: AdminStats | null }) {
  if (!stats) {
    return (
      <div className="vintage-card p-6 text-center">
        <p className="font-vintage-body text-[#6B4C57]">Carregando estatísticas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="vintage-card p-6 text-center">
          <div className="text-3xl mb-2">👥</div>
          <h3 className="font-vintage-subtitle text-lg mb-1" style={{ color: '#6B4C57' }}>
            Usuários Totais
          </h3>
          <p className="font-vintage-title text-2xl" style={{ color: '#8B6F47' }}>
            {stats.totalUsers.toLocaleString()}
          </p>
        </div>

        <div className="vintage-card p-6 text-center">
          <div className="text-3xl mb-2">📦</div>
          <h3 className="font-vintage-subtitle text-lg mb-1" style={{ color: '#6B4C57' }}>
            Produtos Ativos
          </h3>
          <p className="font-vintage-title text-2xl" style={{ color: '#8B6F47' }}>
            {stats.totalProducts.toLocaleString()}
          </p>
        </div>

        <div className="vintage-card p-6 text-center">
          <div className="text-3xl mb-2">💰</div>
          <h3 className="font-vintage-subtitle text-lg mb-1" style={{ color: '#6B4C57' }}>
            Transações
          </h3>
          <p className="font-vintage-title text-2xl" style={{ color: '#8B6F47' }}>
            {stats.totalTransactions.toLocaleString()}
          </p>
        </div>

        <div className="vintage-card p-6 text-center">
          <div className="text-3xl mb-2">💵</div>
          <h3 className="font-vintage-subtitle text-lg mb-1" style={{ color: '#6B4C57' }}>
            Receita Total
          </h3>
          <p className="font-vintage-title text-2xl" style={{ color: '#8B6F47' }}>
            R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="vintage-card p-6">
          <h3 className="font-vintage-subtitle text-lg mb-4" style={{ color: '#6B4C57' }}>
            📊 Usuários Recentes
          </h3>
          <div className="space-y-3">
            {stats.recentUsers.map((user: RecentUser) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-[#F5F1E8] rounded-lg">
                <div>
                  <p className="font-vintage-subtitle text-sm text-[#3C3C3C]">{user.name}</p>
                  <p className="font-vintage-body text-xs text-[#6B4C57]">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-vintage-body text-xs text-[#6B4C57]">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vintage-card p-6">
          <h3 className="font-vintage-subtitle text-lg mb-4" style={{ color: '#6B4C57' }}>
            📦 Produtos Recentes
          </h3>
          <div className="space-y-3">
            {stats.recentProducts.map((product: RecentProduct) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-[#F5F1E8] rounded-lg">
                <div>
                  <p className="font-vintage-subtitle text-sm text-[#3C3C3C]">{product.title}</p>
                  <p className="font-vintage-body text-xs text-[#6B4C57]">{product.seller_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-vintage-subtitle text-sm" style={{ color: '#8B6F47' }}>
                    R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || data);
        setTotalUsers(data.pagination?.total || data.length || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserVerification = async (userId: string, currentVerified: boolean) => {
    setEditingUser(userId);
    try {
      const csrf = getCsrfToken();
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'x-csrf-token': csrf } : {}),
        },
        body: JSON.stringify({
          verified: !currentVerified
        })
      });

      if (response.ok) {
        // Atualizar a lista local
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, verified: !currentVerified }
            : user
        ));
        alert(`Usuário ${!currentVerified ? 'verificado' : 'desverificado'} com sucesso!`);
      } else {
        throw new Error('Erro ao atualizar usuário');
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      alert('Erro ao atualizar usuário. Tente novamente.');
    } finally {
      setEditingUser(null);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  return (
    <div className="vintage-card p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-vintage-subtitle text-lg" style={{ color: '#6B4C57' }}>
            👥 Gerenciar Usuários
          </h3>
          <p className="font-vintage-body text-sm mt-1" style={{ color: '#8B6F47' }}>
            ✅ <strong>Usuários Verificados:</strong> Confirmaram email e têm maior credibilidade
          </p>
        </div>
        <div className="vintage-card p-3 bg-[#F5F1E8]">
          <div className="text-center">
            <div className="font-vintage-title text-2xl" style={{ color: '#8B6F47' }}>
              {totalUsers.toLocaleString()}
            </div>
            <div className="font-vintage-body text-xs" style={{ color: '#6B4C57' }}>
              Total de Usuários
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <p className="text-center font-vintage-body text-[#6B4C57]">Carregando usuários...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8DCC6]">
                <th className="text-left font-vintage-subtitle text-[#6B4C57] p-2">Nome</th>
                <th className="text-left font-vintage-subtitle text-[#6B4C57] p-2">Email</th>
                <th className="text-left font-vintage-subtitle text-[#6B4C57] p-2">Verificado</th>
                <th className="text-left font-vintage-subtitle text-[#6B4C57] p-2">Data Cadastro</th>
                <th className="text-left font-vintage-subtitle text-[#6B4C57] p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: User) => (
                <tr key={user.id} className="border-b border-[#F5F1E8]">
                  <td className="font-vintage-body text-[#3C3C3C] p-2">{user.name}</td>
                  <td className="font-vintage-body text-[#3C3C3C] p-2">{user.email}</td>
                  <td className="p-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-vintage-body flex items-center space-x-1 ${
                        user.verified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        <span>{user.verified ? '✅' : '⏳'}</span>
                        <span>{user.verified ? 'Verificado' : 'Pendente'}</span>
                      </span>
                    </div>
                  </td>
                  <td className="font-vintage-body text-[#6B4C57] p-2">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-2">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => openEditModal(user)}
                        className="text-[#8B6F47] hover:text-[#6B4C57] font-vintage-body text-sm transition-colors"
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        onClick={() => toggleUserVerification(user.id, user.verified)}
                        disabled={editingUser === user.id}
                        className={`text-sm font-vintage-body transition-colors ${
                          editingUser === user.id 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : user.verified 
                              ? 'text-orange-600 hover:text-orange-800'
                              : 'text-green-600 hover:text-green-800'
                        }`}
                      >
                        {editingUser === user.id ? '⏳' : user.verified ? '❌' : '✅'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal de Edição */}
      {showEditModal && selectedUser && (
        <EditUserModal 
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSave={(updatedUser) => {
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
            setShowEditModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || data);
        setTotalProducts(data.pagination?.total || data.length || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProduct = (productId: string) => {
    // Abre o produto em uma nova aba
    window.open(`/products/${productId}`, '_blank');
  };

  const handleRemoveProduct = async (productId: string, productTitle: string) => {
    if (confirm(`Tem certeza que deseja remover o produto "${productTitle}"?`)) {
      try {
        const csrf = getCsrfToken();
        const response = await fetch(`/api/admin/products?id=${productId}`, {
          method: 'DELETE',
          headers: {
            ...(csrf ? { 'x-csrf-token': csrf } : {}),
          },
        });

        if (response.ok) {
          // Atualizar a lista local
          setProducts(products.filter(p => p.id !== productId));
          setTotalProducts(totalProducts - 1);
          alert('Produto removido com sucesso!');
        } else {
          throw new Error('Erro ao remover produto');
        }
      } catch (error) {
        console.error('Erro ao remover produto:', error);
        alert('Erro ao remover produto. Tente novamente.');
      }
    }
  };

  return (
    <div className="vintage-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-vintage-subtitle text-lg" style={{ color: '#6B4C57' }}>
          📦 Gerenciar Produtos
        </h3>
        <div className="vintage-card p-3 bg-[#F5F1E8]">
          <div className="text-center">
            <div className="font-vintage-title text-2xl" style={{ color: '#8B6F47' }}>
              {totalProducts.toLocaleString()}
            </div>
            <div className="font-vintage-body text-xs" style={{ color: '#6B4C57' }}>
              Total de Produtos
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <p className="text-center font-vintage-body text-[#6B4C57]">Carregando produtos...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8DCC6]">
                <th className="text-left font-vintage-subtitle text-[#6B4C57] p-2">Título</th>
                <th className="text-left font-vintage-subtitle text-[#6B4C57] p-2">Vendedor</th>
                <th className="text-left font-vintage-subtitle text-[#6B4C57] p-2">Preço</th>
                <th className="text-left font-vintage-subtitle text-[#6B4C57] p-2">Status</th>
                <th className="text-left font-vintage-subtitle text-[#6B4C57] p-2">Data</th>
                <th className="text-left font-vintage-subtitle text-[#6B4C57] p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product: Product) => (
                <tr key={product.id} className="border-b border-[#F5F1E8]">
                  <td className="font-vintage-body text-[#3C3C3C] p-2">{product.title}</td>
                  <td className="font-vintage-body text-[#3C3C3C] p-2">{product.seller_name}</td>
                  <td className="font-vintage-body text-[#8B6F47] p-2">
                    R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-vintage-body ${
                      product.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                      product.status === 'vendido' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="font-vintage-body text-[#6B4C57] p-2">
                    {new Date(product.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-2">
                    <button 
                      onClick={() => handleViewProduct(product.id)}
                      className="text-[#8B6F47] hover:text-[#6B4C57] font-vintage-body text-sm mr-2"
                    >
                      Ver
                    </button>
                    <button 
                      onClick={() => handleRemoveProduct(product.id, product.title)}
                      className="text-red-600 hover:text-red-800 font-vintage-body text-sm"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TransactionsTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTransactions, setTotalTransactions] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/admin/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || data);
        setTotalTransactions(data.pagination?.total || data.length || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vintage-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-vintage-subtitle text-lg" style={{ color: '#6B4C57' }}>
          💰 Gerenciar Transações
        </h3>
        <div className="vintage-card p-3 bg-[#F5F1E8]">
          <div className="text-center">
            <div className="font-vintage-title text-2xl" style={{ color: '#8B6F47' }}>
              {totalTransactions.toLocaleString()}
            </div>
            <div className="font-vintage-body text-xs" style={{ color: '#6B4C57' }}>
              Total de Transações
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <p className="text-center font-vintage-body text-[#6B4C57]">Carregando transações...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8DCC6]">
                <th className="text-left font-vintage-subtitle text-[#6B4C57] p-2">ID</th>
                <th className="text-left font-vintage-subtitle text-[#6B4C57] p-2">Produto</th>
                <th className="text-left font-vintage-subtitle text-[#6B4C57] p-2">Valor</th>
                <th className="text-left font-vintage-subtitle text-[#6B4C57] p-2">Taxa Proteção (4%)</th>
                <th className="text-left font-vintage-subtitle text-[#6B4C57] p-2">Status</th>
                <th className="text-left font-vintage-subtitle text-[#6B4C57] p-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction: Transaction) => (
                <tr key={transaction.id} className="border-b border-[#F5F1E8]">
                  <td className="font-vintage-body text-[#3C3C3C] p-2 font-mono text-xs">
                    {transaction.id.substring(0, 8)}...
                  </td>
                  <td className="font-vintage-body text-[#3C3C3C] p-2">{transaction.product_title}</td>
                  <td className="font-vintage-body text-[#8B6F47] p-2">
                    R$ {Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="font-vintage-body text-[#6B4C57] p-2">
                    R$ {Number(transaction.platform_fee).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-vintage-body ${
                      transaction.status === 'paid' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="font-vintage-body text-[#6B4C57] p-2">
                    {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}