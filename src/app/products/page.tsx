'use client';

import { useState, useEffect } from 'react';
import { Product, Category } from '@/types';
import ProductCard from '@/components/ProductCard';
import CategoryFilter from '@/components/CategoryFilter';
import SearchBar from '@/components/SearchBar';
import PriceFilter from '@/components/PriceFilter';
import Pagination from '@/components/Pagination';

interface ProductsResponse {
  products: (Product & { seller_name: string; seller_rating: number; category_name: string })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductsResponse['products']>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<ProductsResponse['pagination'] | null>(null);
  
  // Filtros
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Carregar categorias
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      }
    };

    fetchCategories();
  }, []);

  // Carregar produtos
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedCondition) params.append('condition', selectedCondition);
        if (priceRange.min) params.append('minPrice', priceRange.min);
        if (priceRange.max) params.append('maxPrice', priceRange.max);
        if (searchQuery) params.append('search', searchQuery);
        params.append('page', currentPage.toString());
        params.append('limit', '12');

        const response = await fetch(`/api/products?${params.toString()}`);
        const data: ProductsResponse = await response.json();
        
        setProducts(data.products);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, selectedCondition, priceRange, searchQuery, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedCondition('');
    setPriceRange({ min: '', max: '' });
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F5F1E8 0%, #E8DCC6 100%)' }}>
      <div className="container mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-vintage-title text-4xl mb-2" style={{ color: '#8B6F47' }}>Catálogo de Produtos</h1>
          <p className="font-vintage-body" style={{ color: '#6B4C57' }}>Encontre produtos únicos de segunda mão</p>
        </div>

        {/* Barra de busca */}
        <div className="mb-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar produtos..."
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar com filtros */}
          <div className="lg:w-1/4">
            <div className="vintage-card p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-vintage-subtitle" style={{ color: '#3C3C3C' }}>Filtros</h2>
                <button
                  onClick={handleResetFilters}
                  className="text-sm font-vintage-body hover:underline"
                  style={{ color: '#8B6F47' }}
                >
                  Limpar filtros
                </button>
              </div>

              {/* Filtro por categoria */}
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />

              {/* Filtro por condição */}
              <div className="mb-6">
                <h3 className="text-sm font-vintage-subtitle mb-3" style={{ color: '#3C3C3C' }}>Condição</h3>
                <div className="space-y-2">
                  {[
                    { value: '', label: 'Todas' },
                    { value: 'novo', label: 'Novo' },
                    { value: 'seminovo', label: 'Seminovo' },
                    { value: 'usado', label: 'Usado' },
                    { value: 'para_pecas', label: 'Para peças' }
                  ].map((condition) => (
                    <label key={condition.value} className="flex items-center">
                      <input
                        type="radio"
                        name="condition"
                        value={condition.value}
                        checked={selectedCondition === condition.value}
                        onChange={(e) => setSelectedCondition(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm font-vintage-body" style={{ color: '#6B4C57' }}>{condition.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filtro por preço */}
              <PriceFilter
                priceRange={priceRange}
                onPriceChange={setPriceRange}
              />
            </div>
          </div>

          {/* Lista de produtos */}
          <div className="lg:w-3/4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-2" style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4" style={{ color: '#8B6F47' }}>📦</div>
                <h3 className="text-xl font-vintage-subtitle mb-2" style={{ color: '#3C3C3C' }}>Nenhum produto encontrado</h3>
                <p className="font-vintage-body" style={{ color: '#6B4C57' }}>Tente ajustar os filtros ou termos de busca</p>
              </div>
            ) : (
              <>
                {/* Informações da busca */}
                <div className="flex justify-between items-center mb-6">
                  <p className="font-vintage-body" style={{ color: '#6B4C57' }}>
                    {pagination?.total} produto{pagination?.total !== 1 ? 's' : ''} encontrado{pagination?.total !== 1 ? 's' : ''}
                  </p>
                  <select className="px-3 py-1 text-sm vintage-input" style={{ paddingTop: '0.4rem', paddingBottom: '0.4rem' }}>
                    <option>Mais recentes</option>
                    <option>Menor preço</option>
                    <option>Maior preço</option>
                    <option>Melhor avaliação</option>
                  </select>
                </div>

                {/* Grid de produtos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}
                </div>

                {/* Paginação */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                      hasNext={pagination.hasNext}
                      hasPrev={pagination.hasPrev}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}