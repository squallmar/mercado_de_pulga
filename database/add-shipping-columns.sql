-- Adicionar colunas de dimensões de envio na tabela products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS shipping_weight DECIMAL(10, 3),
ADD COLUMN IF NOT EXISTS shipping_height INTEGER,
ADD COLUMN IF NOT EXISTS shipping_width INTEGER,
ADD COLUMN IF NOT EXISTS shipping_length INTEGER,
ADD COLUMN IF NOT EXISTS local_pickup BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false;

-- Adicionar colunas de endereço na tabela users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS address_street VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100),
ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100),
ADD COLUMN IF NOT EXISTS address_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS address_state VARCHAR(2),
ADD COLUMN IF NOT EXISTS address_postal_code VARCHAR(9);

-- Criar tabela de envios
CREATE TABLE IF NOT EXISTS shipments (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  method VARCHAR(50) NOT NULL, -- 'carrier', 'local_pickup', 'local_meeting'
  carrier_name VARCHAR(100),
  service_name VARCHAR(100),
  tracking_code VARCHAR(100),
  melhor_envio_order_id VARCHAR(100),
  label_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  from_address JSONB NOT NULL,
  to_address JSONB NOT NULL,
  package_weight DECIMAL(10, 3),
  package_height INTEGER,
  package_width INTEGER,
  package_length INTEGER,
  tracking_events JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_shipments_transaction ON shipments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_code);
CREATE INDEX IF NOT EXISTS idx_shipments_melhor_envio ON shipments(melhor_envio_order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);

-- Comentários
COMMENT ON TABLE shipments IS 'Tabela para gerenciar envios de produtos';
COMMENT ON COLUMN shipments.method IS 'Método de envio: carrier (transportadora), local_pickup (retirada local), local_meeting (encontro presencial)';
COMMENT ON COLUMN shipments.status IS 'Status: pending, label_generated, posted, in_transit, out_for_delivery, delivered, cancelled, ready_for_pickup, picked_up, meeting_scheduled, completed';

-- Atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_shipments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_shipments_updated_at ON shipments;
CREATE TRIGGER trigger_update_shipments_updated_at
BEFORE UPDATE ON shipments
FOR EACH ROW
EXECUTE FUNCTION update_shipments_updated_at();

COMMIT;
