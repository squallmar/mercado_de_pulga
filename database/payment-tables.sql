-- SQL para criar tabelas do sistema de pagamentos
-- Execute no PostgreSQL do projeto

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    buyer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    seller_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('pix', 'credit_card', 'debit_card', 'boleto')),
    payment_provider VARCHAR(20) NOT NULL CHECK (payment_provider IN ('mercadopago', 'stripe', 'pagseguro')),
    provider_transaction_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'released', 'refunded', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de pagamentos (detalhes técnicos)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    payment_method_details JSONB NOT NULL,
    provider_response JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de eventos de webhook
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    provider VARCHAR(20) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de disputas
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('item_not_received', 'item_not_as_described', 'payment_issue', 'other')),
    description TEXT NOT NULL,
    opened_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    resolution VARCHAR(30) CHECK (resolution IN ('refund_buyer', 'release_to_seller', 'partial_refund')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_payment_id ON webhook_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);

CREATE INDEX IF NOT EXISTS idx_disputes_transaction_id ON disputes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_disputes_updated_at 
    BEFORE UPDATE ON disputes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE transactions IS 'Transações de compra/venda entre usuários';
COMMENT ON TABLE payments IS 'Detalhes técnicos dos pagamentos processados pelos gateways';
COMMENT ON TABLE webhook_events IS 'Log de eventos recebidos dos gateways de pagamento';
COMMENT ON TABLE disputes IS 'Disputas abertas por compradores ou vendedores';

COMMENT ON COLUMN transactions.platform_fee IS 'Taxa cobrada pela plataforma (em reais)';
COMMENT ON COLUMN transactions.seller_amount IS 'Valor que o vendedor recebe após dedução da taxa';
COMMENT ON COLUMN transactions.provider_transaction_id IS 'ID da transação no gateway de pagamento';

-- Constraint para garantir que platform_fee + seller_amount = amount
ALTER TABLE transactions ADD CONSTRAINT check_amounts 
    CHECK (platform_fee + seller_amount = amount);