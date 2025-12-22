# Guia Rápido - Sistema de Frete

## 🚀 Configuração Inicial

### 1. Configurar Melhor Envio

1. **Ambiente de Testes (Sandbox):**
   - Criar conta em https://sandbox.melhorenvio.com.br
   - Saldo inicial: R$ 10.000,00 para testes
   - Cadastro simplificado
   - Apenas 2 transportadoras (Correios e Jadlog)

2. **Ambiente de Produção:**
   - Criar conta em https://melhorenvio.com.br
   - Cadastro completo com dados reais
   - Todas as transportadoras disponíveis

3. **Obter Token de API:**
   - Acessar **Minha Conta** → **Configurações** → **Tokens de API**
   - Copiar o token gerado
   - **Importante**: 
     * Token válido por 30 dias
     * Refresh token válido por 45 dias
     * Renovar antes do vencimento para manter acesso

4. **Configurar no .env:**
```bash
# Para testes
MELHOR_ENVIO_TOKEN=seu-token-sandbox
MELHOR_ENVIO_SANDBOX=true

# Para produção
MELHOR_ENVIO_TOKEN=seu-token-producao
MELHOR_ENVIO_SANDBOX=false
```

### Limitações da API

- **Limite de requisições**: 250 requisições por minuto por usuário
- **User-Agent obrigatório**: Nome da aplicação + email de contato
- **Protocolo**: HTTPS obrigatório
- **Headers obrigatórios**:
  - `Accept: application/json`
  - `Content-Type: application/json`
  - `Authorization: Bearer {token}`
  - `User-Agent: Aplicação (email@contato.com)`

### 2. Executar Migração do Banco de Dados

```bash
psql -U seu_usuario -d mercadodepulgas -f database/add-shipping-system.sql
```

Isso irá criar:
- Tabela `shipments` (envios)
- Campos de dimensões nos produtos (peso, altura, largura, comprimento)
- Campos de endereço nos usuários

## 📦 Como Funciona

### Para o Comprador

1. **Visualizar produto**: Na página do produto, a calculadora de frete aparece automaticamente
2. **Calcular frete**: Digite o CEP e clique em "Calcular"
3. **Escolher opção**: 
   - 🚚 **Transportadora** (PAC, SEDEX, Jadlog)
   - 📦 **Retirada Local** (buscar com vendedor)
   - 🤝 **Encontro Presencial** (combinar local)
4. **Finalizar compra**: O valor do frete é incluído no total

### Para o Vendedor

#### Configurar Produto

No formulário de cadastro/edição de produto, preencha:
- **Peso** (kg)
- **Altura** (cm)
- **Largura** (cm)
- **Comprimento** (cm)

> Importante: Sem essas informações, apenas retirada local e encontro presencial estarão disponíveis.

#### Gerenciar Envios

Após venda com frete por transportadora:

1. **Gerar Etiqueta**:
```bash
POST /api/shipping/{shipment_id}/generate-label
```
Retorna URL do PDF da etiqueta para imprimir

2. **Imprimir e Postar**:
- Baixar etiqueta
- Colar no pacote
- Levar aos Correios/agência

3. **Rastreamento Automático**:
- Sistema atualiza status automaticamente
- Comprador visualiza em tempo real

## 🔧 Endpoints da API

### Calcular Frete
```javascript
POST /api/shipping/calculate
{
  "product_id": "123",
  "to_postal_code": "01310100"
}
```

**Resposta**:
```json
{
  "options": [
    {
      "id": "1",
      "name": "PAC",
      "price": 25.50,
      "delivery_time": 8,
      "company": {
        "name": "Correios",
        "picture": "url-logo"
      }
    },
    {
      "id": "local_pickup",
      "name": "Retirada Local",
      "price": 0,
      "delivery_time": 0,
      "method": "local_pickup"
    }
  ]
}
```

### Criar Envio
```javascript
POST /api/shipping/create
{
  "transaction_id": "456",
  "method": "carrier",
  "carrier_name": "PAC",
  "from_address": { /* endereço vendedor */ },
  "to_address": { /* endereço comprador */ },
  "package_weight": 0.5,
  "package_height": 10,
  "package_width": 15,
  "package_length": 20
}
```

### Gerar Etiqueta
```javascript
POST /api/shipping/{id}/generate-label
```

**Resposta**:
```json
{
  "label_url": "https://melhorenvio.com.br/label.pdf",
  "tracking_code": "ME123456789BR",
  "message": "Etiqueta gerada com sucesso"
}
```

### Rastrear Envio
```javascript
GET /api/shipping/{id}/tracking
```

**Resposta**:
```json
{
  "tracking_code": "ME123456789BR",
  "status": "in_transit",
  "method": "carrier",
  "events": [
    {
      "date": "2024-01-15T10:30:00Z",
      "description": "Objeto postado",
      "location": "São Paulo - SP"
    },
    {
      "date": "2024-01-16T14:20:00Z",
      "description": "Objeto em trânsito",
      "location": "Rio de Janeiro - RJ"
    }
  ]
}
```

## 🎨 Componentes de UI

### ShippingCalculator

Calculadora de frete para páginas de produto:

```tsx
import ShippingCalculator from '@/components/ShippingCalculator';

<ShippingCalculator 
  productId="123"
  onSelectShipping={(option) => {
    console.log('Frete selecionado:', option);
  }}
/>
```

### ShippingTrackingPanel

Painel de rastreamento para vendedor/comprador:

```tsx
import ShippingTrackingPanel from '@/components/ShippingTrackingPanel';

<ShippingTrackingPanel 
  shipmentId="456"
  autoRefresh={true}
  refreshInterval={60} // segundos
/>
```

## 💰 Custos

### Melhor Envio
- **Integração**: GRATUITA (sem taxas ou mensalidades)
- **Descontos**: 30-50% sobre tabela dos Correios
- **Pagamento**: Apenas pelo frete real utilizado
- **Sandbox**: Grátis com saldo de R$ 10.000 para testes

### Etiquetas - Validade
- **Carrinho**: 7 dias para realizar o pagamento
- **Pago**: 7 dias para gerar a etiqueta
- **Gerada**: 7 dias para realizar a postagem
- **Cancelamento**: Automático após vencimento

### Processamento Automático (Sandbox)
- **Geração**: Etiqueta disponível imediatamente
- **Status "Postado"**: 15 minutos após geração
- **Status "Entregue"**: 15 minutos após postagem

### Métodos Locais
- **Retirada Local**: Grátis
- **Encontro Presencial**: Grátis
- **Frete Grátis**: Vendedor pode definir em configurações do produto

## ⚠️ Importante

1. **CEP**: Válido apenas para Brasil (8 dígitos)
2. **Dimensões**: Peso mínimo 0.001 kg, máximo 30 kg
3. **Valor**: Máximo R$ 10.000 para seguro
4. **Sandbox**: 
   - Use `MELHOR_ENVIO_SANDBOX=true` para testes
   - Apenas Correios e Jadlog disponíveis
   - Processamento automático de status
5. **Produção**: 
   - Configure `MELHOR_ENVIO_SANDBOX=false`
   - Use token de produção
   - Cadastro completo necessário
6. **Token**:
   - Válido por 30 dias
   - Renovar com refresh_token (válido 45 dias)
   - Manter ciclo de renovação para acesso contínuo
7. **Limite de Requisições**: 250 por minuto por usuário

## 🔍 Status de Envio

| Status | Descrição |
|--------|-----------|
| `pending` | Aguardando geração de etiqueta |
| `label_generated` | Etiqueta gerada, aguardando postagem |
| `posted` | Postado nos Correios |
| `in_transit` | Em trânsito |
| `out_for_delivery` | Saiu para entrega |
| `delivered` | Entregue |
| `ready_for_pickup` | Pronto para retirada (local) |
| `picked_up` | Retirado pelo comprador |
| `meeting_scheduled` | Encontro agendado |
| `completed` | Concluído |
| `cancelled` | Cancelado |

## 🚨 Troubleshooting

### "Erro ao calcular frete"
- Verificar se produto tem dimensões cadastradas
- Validar CEP (8 dígitos, apenas números)
- Conferir token do Melhor Envio no `.env`

### "Erro ao gerar etiqueta"
- Verificar se shipment pertence ao vendedor logado
- Confirmar que método é `carrier`
- Checar se etiqueta já não foi gerada

### "Rastreamento não disponível"
- Etiqueta precisa ser gerada primeiro
- Código de rastreamento pode demorar até 24h para ativar
- Verificar conexão com API do Melhor Envio

## 📚 Recursos Adicionais

### Diferenças: Sandbox vs Produção

| Recurso | Sandbox | Produção |
|---------|---------|----------|
| **URL** | sandbox.melhorenvio.com.br | www.melhorenvio.com.br |
| **Cadastro** | Simplificado | Completo com documentos |
| **Saldo Inicial** | R$ 10.000 (teste) | R$ 0 (real) |
| **Transportadoras** | Correios, Jadlog | Todas disponíveis |
| **Pagamentos** | Mercado Pago, Moip (simulado) | Todos meios reais |
| **Aprovação Pagamento** | Automática (5 min) | Real |
| **Status Postado** | Automático (15 min) | Manual (postagem real) |
| **Status Entregue** | Automático (15 min) | Real (transportadora) |
| **Etiquetas** | Não valem para envio | Valem para envio real |
| **Token** | Específico do sandbox | Específico de produção |
| **Usuários** | Desconectados | Desconectados |

> **Importante**: Sandbox e Produção são ambientes completamente separados. Você precisa criar contas separadas e tokens separados para cada um.

### Links Úteis

- [Documentação Melhor Envio](https://docs.melhorenvio.com.br/)
- [Calculadora de Frete Online](https://melhorenvio.com.br/calculadora)
- [Status da API](https://status.melhorenvio.com.br/)
- [Sandbox](https://sandbox.melhorenvio.com.br/)
- [Produção](https://melhorenvio.com.br/)
- [Suporte de Integrações](mailto:integracoes@melhorenvio.com)
