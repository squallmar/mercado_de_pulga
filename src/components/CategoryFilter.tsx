import { Category } from '@/types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export default function CategoryFilter({ 
  categories, 
  selectedCategory, 
  onCategoryChange 
}: CategoryFilterProps) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-vintage-subtitle mb-3" style={{ color: '#3C3C3C' }}>Categoria</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        <label className="flex items-center">
          <input
            type="radio"
            name="category"
            value=""
            checked={selectedCategory === ''}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="mr-2"
          />
          <span className="text-sm font-vintage-body" style={{ color: '#6B4C57' }}>Todas as categorias</span>
        </label>
        
        {categories.map((category) => (
          <label key={category.id} className="flex items-center">
            <input
              type="radio"
              name="category"
              value={category.id}
              checked={selectedCategory === category.id}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="mr-2"
            />
            <span className="text-sm font-vintage-body flex items-center" style={{ color: '#6B4C57' }}>
              {category.icon && (
                <span className="mr-2" role="img" aria-label={category.name}>
                  {category.icon}
                </span>
              )}
              {category.name}
              {/* Mostrar contador de produtos se disponível */}
              {'product_count' in category && (
                <span className="ml-auto text-xs" style={{ color: '#8B6F47' }}>
                  ({(category as Category & { product_count: number }).product_count})
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}