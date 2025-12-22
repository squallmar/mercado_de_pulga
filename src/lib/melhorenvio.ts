/**
 * Integração com API do Melhor Envio
 * Documentação: https://docs.melhorenvio.com.br/
 * 
 * IMPORTANTE:
 * - Token válido por 30 dias (renovar com refresh_token)
 * - Refresh token válido por 45 dias  
 * - Limite: 250 requisições por minuto por usuário autenticado
 * - User-Agent obrigatório com nome da aplicação e email de contato
 * - Domínio produção: www.melhorenvio.com.br
 * - Domínio sandbox: sandbox.melhorenvio.com.br
 */

const MELHOR_ENVIO_API = process.env.MELHOR_ENVIO_SANDBOX === 'true' 
  ? 'https://sandbox.melhorenvio.com.br/api/v2' 
  : 'https://www.melhorenvio.com.br/api/v2';

const MELHOR_ENVIO_TOKEN = process.env.MELHOR_ENVIO_TOKEN;

// User-Agent obrigatório conforme documentação oficial
const USER_AGENT = 'Mercado de Pulgas (suporte@mercadodepulgas.com.br)';

/**
 * Headers padrão para requisições ao Melhor Envio
 * Conforme documentação oficial: https://docs.melhorenvio.com.br/
 */
const getMelhorEnvioHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${MELHOR_ENVIO_TOKEN}`,
  'User-Agent': USER_AGENT,
});

interface Address {
  postal_code: string;
  address?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state_abbr?: string;
  country_id?: string;
}

interface Package {
  weight: number;      // kg
  width: number;       // cm
  height: number;      // cm
  length: number;      // cm
  insurance_value?: number;
}

interface ShippingQuote {
  id: number;
  name: string;
  company: {
    id: number;
    name: string;
    picture: string;
  };
  price: string;
  delivery_time: number;
  currency: string;
  packages: Array<{
    price: string;
    discount: string;
    format: string;
    dimensions: {
      height: number;
      width: number;
      length: number;
    };
    weight: string;
    insurance_value: string;
  }>;
}

interface CartItem {
  service: number;
  from: {
    name: string;
    phone: string;
    email: string;
    document: string;
    address: string;
    complement: string;
    number: string;
    district: string;
    city: string;
    state_abbr: string;
    country_id: string;
    postal_code: string;
  };
  to: {
    name: string;
    phone: string;
    email: string;
    document: string;
    address: string;
    complement: string;
    number: string;
    district: string;
    city: string;
    state_abbr: string;
    country_id: string;
    postal_code: string;
  };
  package: Package;
  options?: {
    receipt?: boolean;
    own_hand?: boolean;
    collect?: boolean;
  };
  products?: Array<{
    name: string;
    quantity: number;
    unitary_value: number;
  }>;
}

interface TrackingEvent {
  status: string;
  occurrences: Array<{
    date: string;
    description: string;
    location?: string;
  }>;
}

/**
 * Calcular frete para múltiplas transportadoras
 */
export async function calculateShipping(
  from: Address,
  to: Address,
  pkg: Package
): Promise<ShippingQuote[]> {
  try {
    const response = await fetch(`${MELHOR_ENVIO_API}/me/shipment/calculate`, {
      method: 'POST',
      headers: getMelhorEnvioHeaders(),
      body: JSON.stringify({
        from,
        to,
        package: pkg,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao calcular frete');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao calcular frete:', error);
    throw error;
  }
}

/**
 * Adicionar item ao carrinho do Melhor Envio
 */
export async function addToCart(item: CartItem): Promise<{ id: string; protocol: string }> {
  try {
    const response = await fetch(`${MELHOR_ENVIO_API}/me/cart`, {
      method: 'POST',
      headers: getMelhorEnvioHeaders(),
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao adicionar ao carrinho');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao adicionar ao carrinho:', error);
    throw error;
  }
}

/**
 * Fazer checkout (comprar etiquetas)
 */
export async function checkout(orderIds: string[]): Promise<{ purchase: { id: string; protocol: string } }> {
  try {
    const response = await fetch(`${MELHOR_ENVIO_API}/me/shipment/checkout`, {
      method: 'POST',
      headers: getMelhorEnvioHeaders(),
      body: JSON.stringify({
        orders: orderIds,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao fazer checkout');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao fazer checkout:', error);
    throw error;
  }
}

/**
 * Gerar etiquetas em PDF
 */
export async function generateLabel(orderIds: string[]): Promise<{ url: string }> {
  try {
    const response = await fetch(`${MELHOR_ENVIO_API}/me/shipment/generate`, {
      method: 'POST',
      headers: getMelhorEnvioHeaders(),
      body: JSON.stringify({
        orders: orderIds,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao gerar etiqueta');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao gerar etiqueta:', error);
    throw error;
  }
}

/**
 * Imprimir etiquetas (retorna URL do PDF)
 */
export async function printLabel(orderIds: string[]): Promise<{ url: string }> {
  try {
    const response = await fetch(`${MELHOR_ENVIO_API}/me/shipment/print`, {
      method: 'POST',
      headers: getMelhorEnvioHeaders(),
      body: JSON.stringify({
        mode: 'private',
        orders: orderIds,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao imprimir etiqueta');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao imprimir etiqueta:', error);
    throw error;
  }
}

/**
 * Rastrear pedido
 */
export async function trackShipment(orderId: string): Promise<TrackingEvent> {
  try {
    const response = await fetch(`${MELHOR_ENVIO_API}/me/shipment/tracking`, {
      method: 'POST',
      headers: getMelhorEnvioHeaders(),
      body: JSON.stringify({
        orders: [orderId],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao rastrear pedido');
    }

    const data = await response.json();
    return data[orderId] || { status: 'unknown', occurrences: [] };
  } catch (error) {
    console.error('Erro ao rastrear pedido:', error);
    throw error;
  }
}

/**
 * Cancelar pedido (antes de postar)
 */
export async function cancelShipment(orderId: string): Promise<{ canceled: boolean }> {
  try {
    const response = await fetch(`${MELHOR_ENVIO_API}/me/shipment/cancel`, {
      method: 'POST',
      headers: getMelhorEnvioHeaders(),
      body: JSON.stringify({
        order: {
          id: orderId,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao cancelar pedido');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    throw error;
  }
}

/**
 * Buscar informações de endereço pelo CEP
 */
export async function getAddressByCep(cep: string): Promise<{
  postal_code: string;
  address: string;
  district: string;
  city: string;
  state_abbr: string;
  country_id: string;
}> {
  try {
    const cleanCep = cep.replace(/\D/g, '');
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

    if (!response.ok) {
      throw new Error('CEP não encontrado');
    }

    const data = await response.json();
    
    if (data.erro) {
      throw new Error('CEP inválido');
    }

    return {
      postal_code: data.cep,
      address: data.logradouro,
      district: data.bairro,
      city: data.localidade,
      state_abbr: data.uf,
      country_id: 'BR',
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    throw error;
  }
}

/**
 * Validar formato de CEP
 */
export function isValidCep(cep: string): boolean {
  const cleanCep = cep.replace(/\D/g, '');
  return cleanCep.length === 8;
}

/**
 * Formatar CEP (12345678 -> 12345-678)
 */
export function formatCep(cep: string): string {
  const cleanCep = cep.replace(/\D/g, '');
  return cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2');
}
