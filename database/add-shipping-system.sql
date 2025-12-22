-- Migração: Sistema de Envio e Logística
-- Data: 2025-10-25
-- Descrição: Adiciona suporte para cálculo de frete, rastreamento e múltiplos métodos de envio

-- 1. Adicionar campos de dimensões e endereço em products
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_weight DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_height INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_width INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_length INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS local_pickup BOOLEAN DEFAULT true;

COMMENT ON COLUMN products.shipping_weight IS 'Peso do produto em kg';
COMMENT ON COLUMN products.shipping_height IS 'Altura do pacote em cm';
COMMENT ON COLUMN products.shipping_width IS 'Largura do pacote em cm';
COMMENT ON COLUMN products.shipping_length IS 'Comprimento do pacote em cm';
COMMENT ON COLUMN products.free_shipping IS 'Se verdadeiro, vendedor oferece frete grátis';
COMMENT ON COLUMN products.local_pickup IS 'Se verdadeiro, permite retirada local';

-- 2. Adicionar campos de endereço em users
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_state VARCHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_postal_code VARCHAR(10);

-- 3. Criar tabela de envios
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) NOT NULL,
  
  -- Método de envio
  method VARCHAR(50) NOT NULL CHECK (method IN ('carrier', 'local_pickup', 'local_meeting', 'own')),
  
  -- Dados da transportadora (se method = carrier)
  carrier_name VARCHAR(100),
  service_name VARCHAR(100),
  tracking_code VARCHAR(100),
  label_url TEXT,
  melhor_envio_order_id VARCHAR(100),
  
  -- Custo do frete
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  
  -- Endereços
  from_address JSONB NOT NULL,
  to_address JSONB NOT NULL,
  
  -- Dimensões do pacote
  package_weight DECIMAL(10,2),
  package_height INTEGER,
  package_width INTEGER,
  package_length INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending',
    'label_generated',
    'posted',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'failed',
    'returned'
  )),
  
  -- Rastreamento
  tracking_events JSONB DEFAULT '[]',
  
  -- Encontro local (se method = local_meeting)
  meeting_details JSONB,
  
  -- Timestamps
  posted_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_shipments_transaction ON shipments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_code);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_melhor_envio ON shipments(melhor_envio_order_id);

-- Comentários
COMMENT ON TABLE shipments IS 'Gerenciamento de envios e rastreamento';
COMMENT ON COLUMN shipments.method IS 'carrier=transportadora, local_pickup=retirada, local_meeting=encontro, own=próprio';
COMMENT ON COLUMN shipments.tracking_code IS 'Código de rastreamento da transportadora (ex: BR123456789BR)';
COMMENT ON COLUMN shipments.label_url IS 'URL do PDF da etiqueta de envio';
COMMENT ON COLUMN shipments.tracking_events IS 'Array JSON com histórico de rastreamento';
COMMENT ON COLUMN shipments.meeting_details IS 'Detalhes do encontro presencial (data, hora, local)';

-- 4. Adicionar campo shipping_cost em transactions (se não existir)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0;

-- 5. Valores padrão para produtos existentes (opcional)
-- Produtos pequenos: 0.5kg, 20x15x10cm
UPDATE products 
SET 
  shipping_weight = 0.5,
  shipping_height = 15,
  shipping_width = 20,
  shipping_length = 10,
  local_pickup = true
WHERE shipping_weight IS NULL;

-- Verificar migração
SELECT 
  COUNT(*) as total_products,
  COUNT(shipping_weight) as products_with_weight,
  COUNT(CASE WHEN local_pickup = true THEN 1 END) as products_with_pickup
FROM products;

SELECT COUNT(*) as total_shipments FROM shipments;

COMMENT ON COLUMN transactions.shipping_cost IS 'Custo do frete pago pelo comprador';
