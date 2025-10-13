import { Product } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { isValidImageUrl, formatRating, formatPrice } from '@/lib/utils';

interface ProductCardProps {
  product: Product & {
    seller_name: string;
    seller_rating: number;
    category_name: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'novo':
        return 'bg-green-100 text-green-800';
      case 'seminovo':
        return 'bg-blue-100 text-blue-800';
      case 'usado':
        return 'bg-yellow-100 text-yellow-800';
      case 'para_pecas':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'novo':
        return 'Novo';
      case 'seminovo':
        return 'Seminovo';
      case 'usado':
        return 'Usado';
      case 'para_pecas':
        return 'Para peças';
      default:
        return condition;
    }
  };

  const images = typeof product.images === 'string' 
    ? JSON.parse(product.images) 
    : product.images || [];

  return (
    <Link href={`/products/${product.id}`}>
      <div className="vintage-card overflow-hidden group cursor-pointer">
        {/* Imagem do produto */}
        <div className="relative h-48" style={{ background: '#E8DCC6' }}>
          {images.length > 0 && isValidImageUrl(images[0]) ? (
            <Image
              src={images[0]}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#E8DCC6] to-[#F5F1E8]">
                <Image
                  src={`data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="#E8DCC6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6B4C57" font-size="16" font-family="Arial">Sem Imagem</text></svg>')}`}
                alt="Produto sem imagem"
                fill
                className="object-cover opacity-70"
              />
            </div>
          )}
          
          {/* Badge de condição */}
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConditionColor(product.condition)}`} style={{ border: '1px solid rgba(139,111,71,0.2)', background: '#F5F1E8', color: '#6B4C57' }}>
              {getConditionLabel(product.condition)}
            </span>
          </div>
          
          {/* Badge de múltiplas imagens */}
          {images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs">
              +{images.length - 1}
            </div>
          )}
        </div>

        {/* Conteúdo do card */}
        <div className="p-4">
          {/* Título e preço */}
          <div className="mb-2">
            <h3 className="font-vintage-subtitle line-clamp-2 mb-1" style={{ color: '#3C3C3C' }}>
              {product.title}
            </h3>
            <p className="text-2xl font-vintage-title" style={{ color: '#8B6F47' }}>
              {formatPrice(product.price)}
            </p>
          </div>

          {/* Categoria */}
          <p className="text-sm font-vintage-body mb-2" style={{ color: '#6B4C57' }}>
            {product.category_name}
          </p>

          {/* Localização */}
          {product.location && (
            <p className="text-sm font-vintage-body mb-3 flex items-center" style={{ color: '#6B4C57' }}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {product.location}
            </p>
          )}

          {/* Informações do vendedor */}
          <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #E8DCC6' }}>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2" style={{ background: 'linear-gradient(145deg, #8B6F47, #B4735C)' }}>
                <span className="text-xs font-medium text-white">
                  {product.seller_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-vintage-subtitle" style={{ color: '#3C3C3C' }}>
                  {product.seller_name}
                </p>
                {product.seller_rating && (
                  <div className="flex items-center">
                    <span className="text-xs" style={{ color: '#D4AF37' }}>★</span>
                    <span className="text-xs ml-1" style={{ color: '#6B4C57' }}>
                      {formatRating(product.seller_rating)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Botão de favoritar */}
            <button 
              className="p-2 rounded-full transition-colors group/heart"
              style={{ background: '#F5F1E8', border: '1px solid #E8DCC6' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // TODO: Implementar favoritar
              }}
            >
              <svg className="w-5 h-5 transition-colors group-hover/heart:text-red-500" style={{ color: '#6B4C57' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}