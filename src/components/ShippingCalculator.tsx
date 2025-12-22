'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  delivery_time: number;
  company?: {
    name: string;
    picture: string;
  };
  method?: string;
  description?: string;
}

interface ShippingCalculatorProps {
  productId: string;
  onSelectShipping?: (option: ShippingOption) => void;
}

export default function ShippingCalculator({ productId, onSelectShipping }: ShippingCalculatorProps) {
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [error, setError] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d)/, '$1-$2');
    }
    return numbers.slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCep(formatted);
    setError('');
  };

  const calculateShipping = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      setError('CEP inválido');
      return;
    }

    setLoading(true);
    setError('');
    setOptions([]);

    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          to_postal_code: cleanCep,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao calcular frete');
      }

      const data = await response.json();
      setOptions(data.options || []);
    } catch (err) {
      setError('Erro ao calcular frete. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (option: ShippingOption) => {
    setSelectedOption(option.id);
    if (onSelectShipping) {
      onSelectShipping(option);
    }
  };

  const getMethodIcon = (method?: string) => {
    switch (method) {
      case 'local_pickup':
        return '📦';
      case 'local_meeting':
        return '🤝';
      default:
        return '🚚';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-3">Calcular Frete</h3>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={cep}
          onChange={handleCepChange}
          placeholder="00000-000"
          maxLength={9}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={calculateShipping}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Calculando...' : 'Calcular'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {options.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-2">Opções de envio disponíveis:</p>
          {options.map((option) => (
            <div
              key={option.id}
              onClick={() => handleSelectOption(option)}
              className={`p-3 border rounded-md cursor-pointer transition-all ${
                selectedOption === option.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getMethodIcon(option.method)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      {option.company?.picture && (
                        <Image
                          src={option.company.picture}
                          alt={option.company.name}
                          width={60}
                          height={20}
                          className="h-5 w-auto"
                        />
                      )}
                      <p className="font-medium text-gray-900">{option.name}</p>
                    </div>
                    {option.description && (
                      <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                    )}
                    {option.delivery_time > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Prazo: até {option.delivery_time} dias úteis
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${option.price === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {option.price === 0 ? 'GRÁTIS' : `R$ ${option.price.toFixed(2)}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && options.length === 0 && !error && cep.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          Digite seu CEP para calcular o frete
        </p>
      )}
    </div>
  );
}
