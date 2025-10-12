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