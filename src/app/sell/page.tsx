'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { uploadToCloudinary } from '@/lib/cloudinary';

interface Category {
  id: string;
  name: string;
}

interface ProductForm {
  title: string;
  description: string;
  price: string;
  condition: 'novo' | 'seminovo' | 'usado' | 'para_pecas' | '';
  category_id: string;
  location: string;
  tags: string[];
  images: File[];
  shipping_weight?: string;
  shipping_height?: string;
  shipping_width?: string;
  shipping_length?: string;
  local_pickup?: boolean;
  free_shipping?: boolean;
}

export default function SellPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  const [form, setForm] = useState<ProductForm>({
    title: '',
    description: '',
    price: '',
    condition: '',
    category_id: '',
    location: '',
    tags: [],
    images: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        // A API retorna um array de categorias; usar diretamente
        setCategories(Array.isArray(data) ? data : (data.categories || []));
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      // Fallback para categorias mock
      setCategories([
        { id: '1', name: 'Móveis & Decoração' },
        { id: '2', name: 'Colecionáveis' },
        { id: '3', name: 'Roupas & Acessórios' },
        { id: '4', name: 'Livros & Revistas' },
        { id: '5', name: 'Eletrônicos Vintage' }
      ]);
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

    fetchCategories();
  }, [session, status, router, fetchCategories]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (form.images.length + files.length > 5) {
      alert('Máximo de 5 imagens permitidas');
      return;
    }

    const newImages = [...form.images, ...files];
    const newUrls = [...imageUrls];

    files.forEach(file => {
      const url = URL.createObjectURL(file);
      newUrls.push(url);
    });

    setForm({ ...form, images: newImages });
    setImageUrls(newUrls);
  };

  const removeImage = (index: number) => {
    const newImages = form.images.filter((_, i) => i !== index);
    const newUrls = imageUrls.filter((_, i) => i !== index);
    
    URL.revokeObjectURL(imageUrls[index]);
    
    setForm({ ...form, images: newImages });
    setImageUrls(newUrls);
  };

  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim()) && form.tags.length < 5) {
      setForm({ ...form, tags: [...form.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm({ ...form, tags: form.tags.filter(tag => tag !== tagToRemove) });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) newErrors.title = 'Título é obrigatório';
    if (!form.description.trim()) newErrors.description = 'Descrição é obrigatória';
    if (!form.price.trim()) newErrors.price = 'Preço é obrigatório';
    if (form.price && isNaN(parseFloat(form.price))) newErrors.price = 'Preço deve ser um número válido';
    if (!form.condition) newErrors.condition = 'Condição é obrigatória';
    if (!form.category_id) newErrors.category_id = 'Categoria é obrigatória';
    if (!form.location.trim()) newErrors.location = 'Localização é obrigatória';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);

    try {
      // Fazer upload das imagens para o Cloudinary e coletar URLs seguras
      const imageUrls: string[] = [];
      for (const file of form.images) {
        const { url } = await uploadToCloudinary(file);
        imageUrls.push(url);
      }
      
      const productData = {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        condition: form.condition,
        category_id: form.category_id,
        seller_id: session?.user?.id || 'temp-user-id', // TODO: Pegar ID real do usuário logado
        images: imageUrls,
        location: form.location,
        tags: form.tags,
        shipping_weight: form.shipping_weight ? parseFloat(form.shipping_weight) : null,
        shipping_height: form.shipping_height ? parseInt(form.shipping_height) : null,
        shipping_width: form.shipping_width ? parseInt(form.shipping_width) : null,
        shipping_length: form.shipping_length ? parseInt(form.shipping_length) : null,
        local_pickup: form.local_pickup || false,
        free_shipping: form.free_shipping || false,
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao cadastrar produto');
      }

      const newProduct = await response.json();
      console.log('Produto criado:', newProduct);
      
      alert('Produto cadastrado com sucesso!');
      router.push('/my-products');
      
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      alert(`Erro ao cadastrar produto: ${error instanceof Error ? error.message : 'Tente novamente.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC6] p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="vintage-card p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-[#8B6F47] border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 font-vintage-body text-[#6B4C57]">Carregando formulário...</p>
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
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-vintage-title text-3xl mb-2" style={{ color: '#3C3C3C' }}>
            Vender Produto
          </h1>
          <p className="font-vintage-body text-[#6B4C57]">
            Anuncie seu tesouro vintage e encontre um novo dono
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <div className="vintage-card p-6">
            <h2 className="font-vintage-subtitle text-xl mb-4" style={{ color: '#6B4C57' }}>
              Informações Básicas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block font-vintage-subtitle text-[#6B4C57] mb-2">
                  Título do Produto *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={`vintage-input w-full ${errors.title ? 'border-red-400' : ''}`}
                  placeholder="Ex: Poltrona Vintage Anos 70"
                  maxLength={100}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1 font-vintage-body">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block font-vintage-subtitle text-[#6B4C57] mb-2">
                  Preço (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className={`vintage-input w-full ${errors.price ? 'border-red-400' : ''}`}
                  placeholder="0,00"
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1 font-vintage-body">{errors.price}</p>
                )}
              </div>

              <div>
                <label className="block font-vintage-subtitle text-[#6B4C57] mb-2">
                  Condição *
                </label>
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value as 'novo' | 'seminovo' | 'usado' | 'para_pecas' | '' })}
                  className={`vintage-input w-full ${errors.condition ? 'border-red-400' : ''}`}
                >
                  <option value="">Selecione a condição</option>
                  <option value="novo">Novo</option>
                  <option value="seminovo">Seminovo</option>
                  <option value="usado">Usado</option>
                  <option value="para_pecas">Para Peças</option>
                </select>
                {errors.condition && (
                  <p className="text-red-500 text-sm mt-1 font-vintage-body">{errors.condition}</p>
                )}
              </div>

              <div>
                <label className="block font-vintage-subtitle text-[#6B4C57] mb-2">
                  Categoria *
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className={`vintage-input w-full ${errors.category_id ? 'border-red-400' : ''}`}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-sm mt-2 font-vintage-body" style={{ color: '#6B4C57' }}>
                    Nenhuma categoria cadastrada no momento. Tente novamente mais tarde.
                  </p>
                )}
                {errors.category_id && (
                  <p className="text-red-500 text-sm mt-1 font-vintage-body">{errors.category_id}</p>
                )}
              </div>

              <div>
                <label className="block font-vintage-subtitle text-[#6B4C57] mb-2">
                  Localização *
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className={`vintage-input w-full ${errors.location ? 'border-red-400' : ''}`}
                  placeholder="Ex: São Paulo, SP"
                />
                {errors.location && (
                  <p className="text-red-500 text-sm mt-1 font-vintage-body">{errors.location}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block font-vintage-subtitle text-[#6B4C57] mb-2">
                  Descrição *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`vintage-input w-full h-32 resize-none ${errors.description ? 'border-red-400' : ''}`}
                  placeholder="Descreva seu produto com detalhes: história, estado de conservação, características especiais..."
                  maxLength={1000}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description && (
                    <p className="text-red-500 text-sm font-vintage-body">{errors.description}</p>
                  )}
                  <p className="text-sm text-[#6B4C57] font-vintage-body ml-auto">
                    {form.description.length}/1000
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload de imagens */}
          <div className="vintage-card p-6">
            <h2 className="font-vintage-subtitle text-xl mb-4" style={{ color: '#6B4C57' }}>
              Fotos do Produto
            </h2>
            
            <div className="mb-4">
              <label className="block font-vintage-subtitle text-[#6B4C57] mb-2">
                Adicionar Imagens (máximo 5)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="vintage-input w-full"
                disabled={form.images.length >= 5}
              />
              <p className="text-sm text-[#6B4C57] mt-1 font-vintage-body">
                Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB por imagem.
              </p>
            </div>

            {/* Preview das imagens */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={url}
                      alt={`Preview ${index + 1}`}
                      width={150}
                      height={150}
                      className="w-full h-32 object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 bg-[#D4AF37] text-[#3C3C3C] text-xs px-2 py-1 rounded font-vintage-body">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Informações de Envio */}
          <div className="vintage-card p-6">
            <h2 className="font-vintage-subtitle text-xl mb-4" style={{ color: '#6B4C57' }}>
              📦 Informações de Envio (Opcional)
            </h2>
            <p className="text-sm text-[#8B6F47] mb-4 font-vintage-body">
              Preencha as dimensões para que os compradores possam calcular o frete automaticamente. 
              Se não preencher, apenas opções de retirada local estarão disponíveis.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-vintage-body text-sm text-[#6B4C57] mb-1">
                  Peso (kg)
                </label>
                <input 
                  type="number" 
                  step="0.001" 
                  placeholder="Ex: 0.5"
                  className="vintage-input w-full" 
                  onChange={(e) => setForm({ ...form, shipping_weight: e.target.value })}
                />
                <p className="text-xs text-[#8B6F47] mt-1">Peso do produto embalado</p>
              </div>
              <div>
                <label className="block font-vintage-body text-sm text-[#6B4C57] mb-1">
                  Altura (cm)
                </label>
                <input 
                  type="number" 
                  placeholder="Ex: 10"
                  className="vintage-input w-full" 
                  onChange={(e) => setForm({ ...form, shipping_height: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-vintage-body text-sm text-[#6B4C57] mb-1">
                  Largura (cm)
                </label>
                <input 
                  type="number" 
                  placeholder="Ex: 15"
                  className="vintage-input w-full" 
                  onChange={(e) => setForm({ ...form, shipping_width: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-vintage-body text-sm text-[#6B4C57] mb-1">
                  Comprimento (cm)
                </label>
                <input 
                  type="number" 
                  placeholder="Ex: 20"
                  className="vintage-input w-full" 
                  onChange={(e) => setForm({ ...form, shipping_length: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  onChange={(e) => setForm({ ...form, local_pickup: e.target.checked })}
                  className="w-4 h-4 text-[#8B6F47] border-[#E8DCC6] rounded focus:ring-[#8B6F47]"
                />
                <div>
                  <span className="font-vintage-body text-[#3C3C3C]">Permitir retirada local</span>
                  <p className="text-xs text-[#8B6F47]">Comprador pode retirar o produto pessoalmente</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  onChange={(e) => setForm({ ...form, free_shipping: e.target.checked })}
                  className="w-4 h-4 text-[#8B6F47] border-[#E8DCC6] rounded focus:ring-[#8B6F47]"
                />
                <div>
                  <span className="font-vintage-body text-[#3C3C3C]">Frete grátis</span>
                  <p className="text-xs text-[#8B6F47]">Você paga o frete para o comprador</p>
                </div>
              </label>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800 font-vintage-body">
                💡 <strong>Dica:</strong> Produtos com dimensões corretas têm mais chances de venda, 
                pois permitem calcular frete para todo o Brasil com desconto de até 50% nos Correios via Melhor Envio.
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="vintage-card p-6">
            <h2 className="font-vintage-subtitle text-xl mb-4" style={{ color: '#6B4C57' }}>
              Tags (Opcional)
            </h2>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {form.tags.map((tag, index) => (
                <span
                  key={index}
                  className="vintage-tag flex items-center space-x-2"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-[#3C3C3C] hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="vintage-input flex-1"
                placeholder="Digite uma tag e pressione Enter"
                maxLength={20}
                disabled={form.tags.length >= 5}
              />
              <button
                type="button"
                onClick={addTag}
                className="vintage-button px-4 py-2"
                disabled={!newTag.trim() || form.tags.length >= 5}
              >
                Adicionar
              </button>
            </div>
            <p className="text-sm text-[#6B4C57] mt-1 font-vintage-body">
              Máximo de 5 tags. Ex: vintage, retro, anos70, madeira, etc.
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:space-x-4">
            <Link 
              href="/my-products"
              className="w-full md:w-auto px-6 py-3 border-2 border-[#8B6F47] text-[#8B6F47] rounded-lg font-vintage-subtitle hover:bg-[#8B6F47] hover:text-white transition-colors text-center"
            >
              Cancelar
            </Link>
            
            <button
              type="submit"
              disabled={submitting}
              className="w-full md:w-auto vintage-button px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Publicando...</span>
                </div>
              ) : (
                'Publicar Produto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
