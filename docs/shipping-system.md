# Sistema de Envio e Logística - Mercado de Pulgas

## Visão Geral

Sistema completo de envio com múltiplas opções de entrega, integração com transportadoras e rastreamento em tempo real.

## Opções de Entrega

### 1. **Melhor Envio** (Transportadoras)
- **PAC** (Correios) - Econômico, 7-15 dias
- **SEDEX** (Correios) - Rápido, 2-5 dias
- **Jadlog** - Alternativa econômica
- **Azul Cargo** - Envios expressos
- **Desconto:** Até 50% no frete via Melhor Envio

### 2. **Entrega Local/Retirada**
- **Encontro Presencial** - Combinado entre comprador e vendedor
- **Retirada no Local** - Comprador busca no endereço do vendedor
- **Sem custo de envio**

### 3. **Entrega Própria** (Futuro)
- Para vendedores que preferem enviar por conta própria
- Comprovante de postagem manual

## Fluxo de Envio

```
1. Comprador finaliza pagamento
   ↓
2. Vendedor escolhe método de envio
   ↓
3a. Transportadora:
    - Gera etiqueta via Melhor Envio
    - Imprime e cola no pacote
    - Despacha nos Correios/Transportadora
    - Sistema atualiza código de rastreamento
   ↓
3b. Local:
    - Vendedor e comprador combinam encontro
    - Marca como "enviado" após entrega
   ↓
4. Comprador confirma recebimento
   ↓
5. Sistema libera pagamento para vendedor
```

## Cálculo de Frete

### Dados Necessários

**Do Produto:**
- Peso (kg)
- Dimensões (altura, largura, comprimento em cm)
- Valor declarado (para seguro)

**Do Endereço:**
- CEP de origem (vendedor)
- CEP de destino (comprador)

### Exemplo de Cotação

```json
{
  "from": {
    "postal_code": "01310-100" // CEP do vendedor
  },
  "to": {
    "postal_code": "04578-000" // CEP do comprador
  },
  "package": {
    "weight": 0.5,        // kg
    "width": 20,          // cm
    "height": 15,         // cm
    "length": 10          // cm
  },
  "options": {
    "insurance_value": 100.00,
    "receipt": false,
    "own_hand": false
  }
}
```

**Resposta:**
```json
{
  "services": [
    {
      "name": "PAC",
      "price": 18.50,
      "delivery_time": 8,
      "company": "Correios"
    },
    {
      "name": "SEDEX",
      "price": 32.00,
      "delivery_time": 3,
      "company": "Correios"
    },
    {
      "name": "Jadlog .Package",
      "price": 16.90,
      "delivery_time": 7,
      "company": "Jadlog"
    }
  ]
}
```

## Integração com Melhor Envio

### 1. Cadastro e Autenticação

```bash
# 1. Criar conta em https://melhorenvio.com.br/
# 2. Gerar token de API (sandbox e produção)
# 3. Adicionar ao .env
```

```env
MELHOR_ENVIO_TOKEN=Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
MELHOR_ENVIO_SANDBOX=true # false em produção
```

### 2. Endpoints Principais

**Cotação de Frete:**
```typescript
POST https://melhorenvio.com.br/api/v2/me/shipment/calculate
```

**Compra de Etiqueta:**
```typescript
POST https://melhorenvio.com.br/api/v2/me/cart
POST https://melhorenvio.com.br/api/v2/me/shipment/checkout
POST https://melhorenvio.com.br/api/v2/me/shipment/generate
```

**Rastreamento:**
```typescript
GET https://melhorenvio.com.br/api/v2/me/shipment/tracking/:tracking_code
```

### 3. Fluxo de Compra de Etiqueta

```typescript
// 1. Calcular frete
const quote = await calculateShipping(from, to, package);

// 2. Adicionar ao carrinho
const cart = await addToCart(serviceId, package);

// 3. Fazer checkout (pagar)
const purchase = await checkout(cartIds);

// 4. Gerar etiqueta (PDF)
const label = await generateLabel(orderId);

// 5. Obter tracking code
const tracking = purchase.tracking_code;
```

## Estrutura do Banco de Dados

### Tabela `shipments`

```sql
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) NOT NULL,
  
  -- Método de envio
  method VARCHAR(50) NOT NULL CHECK (method IN ('carrier', 'local_pickup', 'local_meeting', 'own')),
  
  -- Dados da transportadora (se method = carrier)
  carrier_name VARCHAR(100),          -- Correios, Jadlog, Azul
  service_name VARCHAR(100),          -- PAC, SEDEX, .Package
  tracking_code VARCHAR(100),
  label_url TEXT,                     -- URL do PDF da etiqueta
  melhor_envio_order_id VARCHAR(100),
  
  -- Custo do frete
  shipping_cost DECIMAL(10,2),
  
  -- Endereços
  from_address JSONB NOT NULL,        -- { cep, street, number, city, state }
  to_address JSONB NOT NULL,
  
  -- Dimensões do pacote
  package_weight DECIMAL(10,2),       -- kg
  package_height INTEGER,              -- cm
  package_width INTEGER,               -- cm
  package_length INTEGER,              -- cm
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending',           -- Aguardando vendedor gerar etiqueta
    'label_generated',   -- Etiqueta gerada, aguardando postagem
    'posted',            -- Postado na transportadora
    'in_transit',        -- Em trânsito
    'out_for_delivery',  -- Saiu para entrega
    'delivered',         -- Entregue
    'failed',            -- Falha na entrega
    'returned'           -- Devolvido ao remetente
  )),
  
  -- Rastreamento
  tracking_events JSONB DEFAULT '[]', -- Histórico de rastreamento
  
  -- Encontro local (se method = local_meeting)
  meeting_details JSONB,              -- { date, time, location, notes }
  
  -- Timestamps
  posted_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shipments_transaction ON shipments(transaction_id);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_code);
CREATE INDEX idx_shipments_status ON shipments(status);
```

### Extensão da Tabela `products`

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_weight DECIMAL(10,2); -- kg
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_height INTEGER;        -- cm
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_width INTEGER;         -- cm
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_length INTEGER;        -- cm
ALTER TABLE products ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS local_pickup BOOLEAN DEFAULT true;
```

### Extensão da Tabela `users`

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_state VARCHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_postal_code VARCHAR(10);
```

## API Endpoints

### 1. Calcular Frete

```typescript
POST /api/shipping/calculate
```

**Body:**
```json
{
  "product_id": "uuid",
  "to_postal_code": "04578-000"
}
```

**Response:**
```json
{
  "options": [
    {
      "id": "carrier_pac",
      "name": "PAC",
      "company": "Correios",
      "price": 18.50,
      "delivery_time": 8,
      "description": "Econômico - 7 a 15 dias úteis"
    },
    {
      "id": "carrier_sedex",
      "name": "SEDEX",
      "company": "Correios",
      "price": 32.00,
      "delivery_time": 3,
      "description": "Rápido - 2 a 5 dias úteis"
    },
    {
      "id": "local_pickup",
      "name": "Retirada no Local",
      "price": 0,
      "description": "Combinar retirada com o vendedor"
    },
    {
      "id": "local_meeting",
      "name": "Encontro Presencial",
      "price": 0,
      "description": "Combinar encontro em local público"
    }
  ]
}
```

### 2. Criar Envio

```typescript
POST /api/shipping/create
```

**Body (Transportadora):**
```json
{
  "transaction_id": "uuid",
  "method": "carrier",
  "service_id": "carrier_pac",
  "from_address": {
    "postal_code": "01310-100",
    "street": "Avenida Paulista",
    "number": "1000",
    "city": "São Paulo",
    "state": "SP"
  }
}
```

**Body (Local):**
```json
{
  "transaction_id": "uuid",
  "method": "local_meeting",
  "meeting_details": {
    "date": "2025-11-01",
    "time": "14:00",
    "location": "Shopping Iguatemi - Praça de Alimentação",
    "notes": "Próximo ao Starbucks"
  }
}
```

### 3. Gerar Etiqueta

```typescript
POST /api/shipping/:id/generate-label
```

**Response:**
```json
{
  "label_url": "https://melhorenvio.com.br/labels/12345.pdf",
  "tracking_code": "BR123456789BR"
}
```

### 4. Atualizar Status

```typescript
PATCH /api/shipping/:id/status
```

**Body:**
```json
{
  "status": "posted"
}
```

### 5. Rastreamento

```typescript
GET /api/shipping/:id/tracking
```

**Response:**
```json
{
  "tracking_code": "BR123456789BR",
  "status": "in_transit",
  "events": [
    {
      "date": "2025-10-26T10:30:00Z",
      "location": "CDD São Paulo/SP",
      "description": "Objeto postado"
    },
    {
      "date": "2025-10-27T08:15:00Z",
      "location": "CTE Campinas/SP",
      "description": "Objeto em trânsito"
    },
    {
      "date": "2025-10-28T14:20:00Z",
      "location": "CDD Rio de Janeiro/RJ",
      "description": "Objeto saiu para entrega"
    }
  ]
}
```

## Interface do Usuário

### 1. Página de Produto (Cálculo de Frete)

```tsx
// Exibir antes da compra
<div className="shipping-calculator">
  <h3>Calcular Frete</h3>
  <input 
    type="text" 
    placeholder="Digite seu CEP"
    value={cep}
    onChange={(e) => setCep(mask.cep(e.target.value))}
  />
  <button onClick={calculateShipping}>Calcular</button>
  
  {shippingOptions.map(option => (
    <div key={option.id}>
      <strong>{option.name}</strong> - R$ {option.price}
      <small>Entrega em {option.delivery_time} dias úteis</small>
    </div>
  ))}
</div>
```

### 2. Checkout (Seleção de Método)

```tsx
<div className="shipping-method-selector">
  {shippingOptions.map(option => (
    <label key={option.id}>
      <input 
        type="radio" 
        name="shipping"
        value={option.id}
        onChange={(e) => setSelectedShipping(e.target.value)}
      />
      <div>
        <strong>{option.name}</strong>
        <p>{option.description}</p>
        <span>R$ {option.price.toFixed(2)}</span>
      </div>
    </label>
  ))}
</div>
```

### 3. Painel do Vendedor (Gerar Etiqueta)

```tsx
<div className="seller-shipping-panel">
  <h2>Pedido #{orderId}</h2>
  
  {shipment.method === 'carrier' && (
    <>
      {!shipment.label_url ? (
        <button onClick={generateLabel}>
          Gerar Etiqueta de Envio
        </button>
      ) : (
        <>
          <a href={shipment.label_url} download>
            📄 Baixar Etiqueta
          </a>
          <p>Código de rastreamento: {shipment.tracking_code}</p>
          <button onClick={() => updateStatus('posted')}>
            Marcar como Postado
          </button>
        </>
      )}
    </>
  )}
  
  {shipment.method === 'local_meeting' && (
    <div>
      <h3>Encontro Combinado</h3>
      <p>📅 {shipment.meeting_details.date} às {shipment.meeting_details.time}</p>
      <p>📍 {shipment.meeting_details.location}</p>
      <button onClick={() => updateStatus('delivered')}>
        Confirmar Entrega
      </button>
    </div>
  )}
</div>
```

### 4. Painel do Comprador (Rastreamento)

```tsx
<div className="buyer-tracking">
  <h2>Rastreamento do Pedido</h2>
  
  {shipment.tracking_code && (
    <div>
      <p>Código: <strong>{shipment.tracking_code}</strong></p>
      
      <div className="tracking-timeline">
        {trackingEvents.map((event, i) => (
          <div key={i} className="tracking-event">
            <div className="timeline-dot"></div>
            <div className="event-details">
              <strong>{event.date}</strong>
              <p>{event.location}</p>
              <p>{event.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      {shipment.status === 'delivered' && (
        <button onClick={confirmReceipt}>
          Confirmar Recebimento
        </button>
      )}
    </div>
  )}
</div>
```

## Custos

### Melhor Envio
- **Cadastro:** Gratuito
- **Mensalidade:** R$ 0
- **Por etiqueta:** Paga apenas o frete (sem taxas extras)
- **Desconto:** 30-50% em relação ao preço público dos Correios

### Exemplo de Economia
- PAC público: R$ 25,00
- PAC Melhor Envio: R$ 13,50 (46% de desconto)

## Webhook de Rastreamento

Melhor Envio envia atualizações automáticas:

```typescript
POST /api/webhooks/melhor-envio
```

**Body:**
```json
{
  "event": "tracking_update",
  "tracking_code": "BR123456789BR",
  "status": "delivered",
  "description": "Objeto entregue ao destinatário"
}
```

## Regras de Negócio

1. **Liberação de Pagamento:**
   - Aguardar confirmação de recebimento do comprador
   - OU 7 dias após status "delivered" automaticamente
   - OU 14 dias após postagem (se não houver contestação)

2. **Disputas:**
   - Comprador pode abrir disputa se não receber em 30 dias
   - Exigir comprovante de postagem do vendedor
   - Reembolso automático se vendedor não comprovar envio

3. **Frete Grátis:**
   - Vendedor pode oferecer frete grátis (absorve o custo)
   - Ou acima de determinado valor (ex: R$ 100)

4. **Proteção ao Comprador:**
   - Seguro automático via Melhor Envio
   - Reembolso garantido se produto não chegar
   - Rastreamento obrigatório para valores > R$ 50

## Próximos Passos

1. ✅ Revisar documentação
2. Implementar migração do banco (shipments, campos em products/users)
3. Criar biblioteca `src/lib/melhorenvio.ts`
4. Implementar endpoints de shipping
5. Criar componentes de UI (calculadora, seletor, rastreamento)
6. Testar em sandbox do Melhor Envio
7. Configurar webhook
8. Deploy em produção

Quer que eu **implemente agora** esse sistema completo de envio?
