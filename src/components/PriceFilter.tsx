interface PriceFilterProps {
  priceRange: { min: string; max: string };
  onPriceChange: (priceRange: { min: string; max: string }) => void;
}

export default function PriceFilter({ priceRange, onPriceChange }: PriceFilterProps) {
  const handleMinPriceChange = (value: string) => {
    onPriceChange({ ...priceRange, min: value });
  };

  const handleMaxPriceChange = (value: string) => {
    onPriceChange({ ...priceRange, max: value });
  };

  const formatCurrency = (value: string) => {
    // Remove tudo que não é número
    const numericValue = value.replace(/\D/g, '');
    
    // Converte para centavos
    const cents = parseInt(numericValue) || 0;
    
    // Formatar como moeda brasileira
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(cents / 100);
  };

  const handleInputChange = (value: string, type: 'min' | 'max') => {
    // Remove formatação e mantém apenas números
    const numericValue = value.replace(/\D/g, '');
    
    if (type === 'min') {
      handleMinPriceChange(numericValue);
    } else {
      handleMaxPriceChange(numericValue);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Faixa de Preço</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Preço mínimo</label>
          <input
            type="text"
            value={priceRange.min ? formatCurrency(priceRange.min) : ''}
            onChange={(e) => handleInputChange(e.target.value, 'min')}
            placeholder="R$ 0,00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-500 mb-1">Preço máximo</label>
          <input
            type="text"
            value={priceRange.max ? formatCurrency(priceRange.max) : ''}
            onChange={(e) => handleInputChange(e.target.value, 'max')}
            placeholder="R$ 0,00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Sugestões de faixa de preço */}
      <div className="mt-3">
        <p className="text-xs text-gray-500 mb-2">Sugestões:</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Até R$ 50', min: '', max: '5000' },
            { label: 'R$ 50 - R$ 100', min: '5000', max: '10000' },
            { label: 'R$ 100 - R$ 500', min: '10000', max: '50000' },
            { label: 'Acima de R$ 500', min: '50000', max: '' }
          ].map((suggestion) => (
            <button
              key={suggestion.label}
              onClick={() => onPriceChange({ min: suggestion.min, max: suggestion.max })}
              className="text-xs px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}