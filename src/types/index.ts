export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  phone?: string;
  location?: string;
  rating?: number;
  verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: 'novo' | 'seminovo' | 'usado' | 'para_pecas';
  category_id: string;
  seller_id: string;
  images: string[];
  location: string;
  status: 'disponivel' | 'vendido' | 'pausado' | 'removido';
  tags?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  parent_id?: string;
  created_at: Date;
}

export interface Offer {
  id: string;
  product_id: string;
  buyer_id: string;
  amount: number;
  message?: string;
  status: 'pendente' | 'aceita' | 'rejeitada' | 'cancelada';
  created_at: Date;
  updated_at: Date;
}

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'offer';
  created_at: Date;
}

export interface Conversation {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  status: 'ativa' | 'arquivada';
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  platform_fee: number;
  seller_amount: number;
  payment_method: 'pix' | 'credit_card' | 'debit_card' | 'boleto';
  payment_provider: 'mercadopago' | 'stripe' | 'pagseguro';
  provider_transaction_id?: string;
  status: 'pending' | 'processing' | 'paid' | 'released' | 'refunded' | 'failed';
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  payment_method_details: {
    type: string;
    pix_qr_code?: string;
    card_last_digits?: string;
    installments?: number;
  };
    provider_response: Record<string, unknown>;
  webhook_events: WebhookEvent[];
  created_at: Date;
  updated_at: Date;
}

export interface WebhookEvent {
  id: string;
  payment_id: string;
  event_type: string;
  provider: string;
    payload: Record<string, unknown>;
  processed: boolean;
  created_at: Date;
}

export interface Dispute {
  id: string;
  transaction_id: string;
  reason: 'item_not_received' | 'item_not_as_described' | 'payment_issue' | 'other';
  description: string;
  opened_by: string; // user_id
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution?: 'refund_buyer' | 'release_to_seller' | 'partial_refund';
  created_at: Date;
  updated_at: Date;
}