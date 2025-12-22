# Sistema de Frete - Melhor Envio

## ✅ Status da Implementação

O sistema de frete está **100% implementado** e pronto para uso conforme as melhores práticas da documentação oficial do Melhor Envio.

## 🎯 Recursos Implementados

- ✅ Integração completa com API do Melhor Envio
- ✅ Cálculo automático de frete para todo Brasil
- ✅ Múltiplas opções de envio:
  - 🚚 Transportadoras (PAC, SEDEX, Jadlog, etc.)
  - 📦 Retirada Local (grátis)
  - 🤝 Encontro Presencial (grátis)
  - 🎁 Frete Grátis (vendedor paga)
- ✅ Geração automática de etiquetas
- ✅ Rastreamento em tempo real
- ✅ Suporte a Sandbox e Produção
- ✅ Headers conformes com documentação oficial
- ✅ User-Agent obrigatório configurado
- ✅ Limite de 250 requisições/minuto respeitado

## 🚀 Como Começar

### 1. Configurar Ambiente de Testes (Sandbox)

```bash
# 1. Criar conta no sandbox
https://sandbox.melhorenvio.com.br

# 2. Obter token de API
Minha Conta → Configurações → Tokens de API

# 3. Adicionar ao .env
MELHOR_ENVIO_TOKEN=seu-token-sandbox
MELHOR_ENVIO_SANDBOX=true
```

### 2. Executar Migração do Banco

```bash
# Já foi executada! Mas se precisar novamente:
curl -X POST http://localhost:3000/api/setup/shipping
```

### 3. Adicionar Dimensões aos Produtos

Ao criar ou editar produtos, preencha:
- **Peso** (kg): Ex: 0.5
- **Altura** (cm): Ex: 10
- **Largura** (cm): Ex: 15
- **Comprimento** (cm): Ex: 20

### 4. Testar Cálculo de Frete

1. Abra qualquer produto com dimensões cadastradas
2. Digite um CEP na calculadora
3. Veja as opções de frete disponíveis

## 📖 Documentação Oficial

Toda implementação segue as especificações da documentação oficial:

- **Domínios corretos**:
  - Sandbox: `https://sandbox.melhorenvio.com.br/api/v2`
  - Produção: `https://www.melhorenvio.com.br/api/v2`

- **Headers obrigatórios**:
  ```javascript
  {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {token}',
    'User-Agent': 'Mercado de Pulgas (suporte@mercadodepulgas.com.br)'
  }
  ```

- **Token de Acesso**:
  - Válido por 30 dias
  - Refresh token válido por 45 dias
  - Renovação automática recomendada

- **Limite de Requisições**:
  - 250 requisições por minuto por usuário
  - Por IP para requisições sem autenticação

## 🔧 Arquivos Principais

```
src/
├── lib/
│   └── melhorenvio.ts          # Biblioteca de integração
├── app/
│   └── api/
│       └── shipping/
│           ├── calculate/
│           │   └── route.ts    # Calcular frete
│           ├── create/
│           │   └── route.ts    # Criar envio
│           └── [id]/
│               ├── generate-label/
│               │   └── route.ts # Gerar etiqueta
│               └── tracking/
│                   └── route.ts # Rastrear
├── components/
│   ├── ShippingCalculator.tsx  # Calculadora de frete
│   └── ShippingTrackingPanel.tsx # Painel de rastreamento
└── sell/
    └── page.tsx                # Formulário com dimensões

database/
├── add-shipping-columns.sql    # Migração principal
└── add-shipping-system.sql     # Migração completa

docs/
├── guia-frete.md              # Guia rápido
└── shipping-system.md         # Documentação completa
```

## 📝 Exemplo de Uso

### Calcular Frete

```typescript
import { calculateShipping } from '@/lib/melhorenvio';

const quotes = await calculateShipping(
  { postal_code: '01310100' }, // De (vendedor)
  { postal_code: '28900000' }, // Para (comprador - Cabo Frio)
  {
    weight: 0.5,    // 500g
    height: 10,     // 10cm
    width: 15,      // 15cm
    length: 20,     // 20cm
    insurance_value: 50.00
  }
);

// Retorna array com opções:
// - PAC: R$ 25,50 (8 dias)
// - SEDEX: R$ 45,00 (3 dias)
// - Jadlog: R$ 30,00 (5 dias)
```

### Gerar Etiqueta

```typescript
// 1. Adicionar ao carrinho
const cart = await addToCart({
  service: 1, // PAC
  from: { /* endereço vendedor */ },
  to: { /* endereço comprador */ },
  package: { /* dimensões */ }
});

// 2. Fazer checkout
const purchase = await checkout([cart.id]);

// 3. Gerar etiqueta
await generateLabel([purchase.purchase.id]);

// 4. Imprimir
const label = await printLabel([purchase.purchase.id]);
console.log(label.url); // URL do PDF
```

## 🎨 Interface do Usuário

### Calculadora de Frete (Comprador)

```tsx
<ShippingCalculator 
  productId="123"
  onSelectShipping={(option) => {
    console.log('Selecionado:', option.name, option.price);
  }}
/>
```

### Rastreamento (Comprador/Vendedor)

```tsx
<ShippingTrackingPanel 
  shipmentId="456"
  autoRefresh={true}
  refreshInterval={60} // segundos
/>
```

## 🔒 Segurança

- ✅ Tokens armazenados em variáveis de ambiente
- ✅ Validação de CEP no backend
- ✅ Autorização de vendedor antes de gerar etiquetas
- ✅ Validação de dados com Zod
- ✅ HTTPS obrigatório

## 🆘 Suporte

- **Documentação**: [docs.melhorenvio.com.br](https://docs.melhorenvio.com.br/)
- **Email**: integracoes@melhorenvio.com
- **Status da API**: [status.melhorenvio.com.br](https://status.melhorenvio.com.br/)

> ⚠️ A equipe do Melhor Envio não presta consultoria de código

## 📦 Particularidades do Sandbox

- Saldo inicial: R$ 10.000 para testes
- Apenas Correios e Jadlog
- Pagamentos aprovados automaticamente em 5 minutos
- Status muda para "postado" em 15 minutos
- Status muda para "entregue" em mais 15 minutos
- Etiquetas não valem para envio real

## 🚀 Migrar para Produção

1. Criar conta real em https://melhorenvio.com.br
2. Obter token de produção
3. Atualizar .env:
   ```bash
   MELHOR_ENVIO_TOKEN=token-producao
   MELHOR_ENVIO_SANDBOX=false
   ```
4. Reiniciar servidor
5. Testar com dados reais
6. Enviar aplicativo para homologação (se aplicável)

---

**Desenvolvido com ❤️ seguindo as melhores práticas do Melhor Envio**
