'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product } from '@/types';
import { isValidImageUrl } from '@/lib/utils';
import { getCsrfToken } from '@/lib/csrf';
import ShippingCalculator from './ShippingCalculator';

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

interface CheckoutModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ product, isOpen, onClose }: CheckoutModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [installments, setInstallments] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [showShippingCalc, setShowShippingCalc] = useState(false);
  // Stripe Checkout redireciona, não mantemos dados locais de pagamento

  if (!isOpen) return null;

  const platformFee = Math.round(product.price * 0.04 * 100) / 100;
  const shippingCost = selectedShipping?.price || 0;
  const totalAmount = product.price + shippingCost;

  const handlePayment = async () => {
    if (!session) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      const csrf = getCsrfToken();
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'x-csrf-token': csrf } : {}),
        },
        body: JSON.stringify({ product_id: product.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao processar pagamento');
      }

      const data = await response.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Não há render específico para PIX via Stripe (Checkout redireciona)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div
        className="vintage-card w-[96%] sm:w-full max-w-sm sm:max-w-md md:max-w-lg p-4 sm:p-6 max-h-[88vh] overflow-y-auto rounded-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Finalizar Compra"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-vintage-title text-lg sm:text-xl" style={{ color: '#6B4C57' }}>
            Finalizar Compra
          </h2>
          <button
            onClick={onClose}
            className="text-[#6B4C57] hover:text-[#8B6F47] text-lg sm:text-xl"
          >
            ✕
          </button>
        </div>

        {/* Resumo do produto */}
        <div className="border-b border-[#E8DCC6] pb-3 sm:pb-4 mb-3 sm:mb-4">
          <div className="flex gap-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#E8DCC6] rounded-lg flex-shrink-0 overflow-hidden relative">
              {(() => {
                // Verificar se images é um array e buscar uma imagem válida
                let images: string[] = [];
                if (typeof product.images === 'string') {
                  try {
                    images = JSON.parse(product.images);
                  } catch {
                    images = [product.images];
                  }
                } else if (Array.isArray(product.images)) {
                  images = product.images;
                }
                
                const validImage = images.find(img => img && isValidImageUrl(img));
                
                return validImage ? (
                  <Image 
                    src={validImage} 
                    alt={product.title}
                    fill
                    sizes="56px"
                    className="object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[#6B4C57] text-xs">📦</span>
                  </div>
                );
              })()}
            </div>
            <div className="flex-1">
              <h3 className="font-vintage-subtitle text-sm sm:text-base text-[#3C3C3C] line-clamp-2">
                {product.title}
              </h3>
              <p className="font-vintage-body text-xs text-[#6B4C57]">
                {product.condition}
              </p>
            </div>
          </div>
        </div>

        {/* Calculadora de Frete (colapsável para telas pequenas) */}
        <div className="mb-3 sm:mb-4">
          <button
            type="button"
            onClick={() => setShowShippingCalc((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-[#E8DCC6] hover:bg-[#F5F1E8] transition-colors"
          >
            <span className="font-vintage-subtitle text-sm" style={{ color: '#6B4C57' }}>
              {showShippingCalc ? 'Ocultar opções de frete' : 'Calcular frete'}
            </span>
            <span className="text-[#8B6F47]">{showShippingCalc ? '▲' : '▼'}</span>
          </button>

          {showShippingCalc && (
            <div className="mt-3">
              <ShippingCalculator 
                productId={product.id.toString()} 
                onSelectShipping={(opt) => {
                  setSelectedShipping(opt);
                  // Ao selecionar, recolhe em telas pequenas
                  if (window.innerWidth < 640) setShowShippingCalc(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Resumo financeiro */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="font-vintage-body text-[#6B4C57]">Preço do produto:</span>
            <span className="font-vintage-subtitle text-[#3C3C3C]">
              R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {selectedShipping && (
            <div className="flex justify-between">
              <span className="font-vintage-body text-[#6B4C57]">Frete ({selectedShipping.name}):</span>
              <span className="font-vintage-body text-[#6B4C57]">
                {selectedShipping.price === 0 
                  ? 'GRÁTIS' 
                  : `R$ ${selectedShipping.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                }
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-vintage-body text-[#6B4C57]">Taxa de proteção da transação:</span>
            <span className="font-vintage-body text-[#6B4C57]">
              R$ {platformFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-xs text-[#8B6F47] italic mb-2">
            Taxa de proteção da transação e rastreamento do produto, para que a negociação saia de forma segura.
          </div>
          <div className="border-t border-[#E8DCC6] pt-2 flex justify-between font-vintage-subtitle">
            <span style={{ color: '#3C3C3C' }}>Total:</span>
            <span style={{ color: '#8B6F47' }}>
              R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Métodos de pagamento */}
        <div className="space-y-3 mb-4 sm:mb-6">
          <h3 className="font-vintage-subtitle text-sm" style={{ color: '#6B4C57' }}>
            Método de Pagamento
          </h3>
          
          <div className="space-y-2">
            <label className={`flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
              paymentMethod === 'pix' ? 'border-[#8B6F47] bg-[#F5F1E8]' : 'border-[#E8DCC6]'
            }`}>
              <input
                type="radio"
                value="pix"
                checked={paymentMethod === 'pix'}
                onChange={(e) => setPaymentMethod(e.target.value as 'pix')}
                className="sr-only"
              />
              <div className="flex items-center space-x-2">
                <span className="text-lg">⚡</span>
                <div>
                  <div className="font-vintage-subtitle text-sm text-[#3C3C3C]">PIX</div>
                  <div className="font-vintage-body text-xs text-[#6B4C57]">Instantâneo</div>
                </div>
              </div>
            </label>

            <label className={`flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
              paymentMethod === 'credit_card' ? 'border-[#8B6F47] bg-[#F5F1E8]' : 'border-[#E8DCC6]'
            }`}>
              <input
                type="radio"
                value="credit_card"
                checked={paymentMethod === 'credit_card'}
                onChange={(e) => setPaymentMethod(e.target.value as 'credit_card')}
                className="sr-only"
              />
              <div className="flex items-center space-x-2">
                <span className="text-lg">💳</span>
                <div>
                  <div className="font-vintage-subtitle text-sm text-[#3C3C3C]">Cartão de Crédito</div>
                  <div className="font-vintage-body text-xs text-[#6B4C57]">Em até 12x</div>
                </div>
              </div>
            </label>
          </div>

          {paymentMethod === 'credit_card' && (
            <div>
              <label className="block font-vintage-body text-sm text-[#6B4C57] mb-1">
                Parcelas:
              </label>
              <select
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                className="vintage-input w-full"
              >
                {[1, 2, 3, 6, 12].map(i => (
                  <option key={i} value={i}>
                    {i}x de R$ {(totalAmount / i).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {i > 1 && ' (sem juros)'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="space-y-2 sticky bottom-0 bg-white/80 pt-2 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <button
            onClick={handlePayment}
            disabled={loading}
            className="vintage-button w-full disabled:opacity-50"
          >
            {loading ? 'Processando...' : `💳 Pagar R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-2 text-[#6B4C57] font-vintage-body hover:text-[#8B6F47]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}