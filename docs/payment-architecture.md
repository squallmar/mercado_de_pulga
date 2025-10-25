# Arquitetura de Pagamentos - Mercado de Pulga

## Fluxo de Pagamento Proposto

### 1. Modelo de Negócio
- **Taxa do Marketplace**: 4% por transação
- **Finalidade da Taxa**: Taxa de proteção da transação e rastreamento do produto, para que a negociação saia de forma segura
- **Split Automático**: 
  - 96% para o vendedor
  - 4% para a plataforma
- **Retenção de Pagamento**: 7-14 dias para verificação

### 2. Métodos de Pagamento
- **PIX** (instantâneo)
- **Cartão de Crédito** (1-12x)
- **Cartão de Débito**
- **Boleto** (opcional)

### 3. Fluxo Técnico

```
[Comprador] → [Checkout] → [Gateway] → [Split] → [Vendedor + Plataforma]
     ↓              ↓           ↓         ↓
[Ofertas]    [Pagamento]  [Webhook]  [Liberação]
```

### 4. Estados da Transação
- `pending` - Aguardando pagamento
- `processing` - Processando pagamento
- `paid` - Pago, aguardando liberação
- `released` - Liberado para vendedor
- `refunded` - Estornado
- `failed` - Falhou

### 5. Segurança
- **Escrow**: Dinheiro fica retido até confirmação
- **Verificação de entrega**: Comprador confirma recebimento
- **Sistema de disputas**: Mediação automática
- **Antifraude**: Análise de risco automática

## Implementação Sugerida

### Fase 1: MVP
- Mercado Pago + PIX básico
- Split simples (92%/8%)
- Webhook para status

### Fase 2: Completa  
- Múltiplos gateways
- Sistema de escrow
- Gestão de disputas
- Dashboard financeiro

### Fase 3: Avançada
- ML para detecção de fraude
- Pagamento recorrente (assinaturas)
- Carteira digital interna