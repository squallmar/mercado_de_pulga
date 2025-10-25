# Guia de Segurança Enterprise - Mercado de Pulgas

## Visão Geral

Este documento descreve todas as camadas de segurança implementadas no Mercado de Pulgas para proteção contra ataques comuns e conformidade com práticas enterprise.

## 1. Autenticação e Autorização

### Role-Based Access Control (RBAC)
- **Roles**: `admin` e `user`
- **Armazenamento**: Coluna `role` na tabela `users`
- **Propagação**: JWT token → Session → Middleware/API routes
- **Verificação**: Middleware protege rotas `/admin` e `/api/admin`

### Gestão de Sessões
- **Provider**: NextAuth.js com estratégia JWT
- **Cookies**: httpOnly, SameSite=Lax, Secure em produção
- **Expiração**: 7 dias (configurável em `session.maxAge`)
- **Senha**: bcrypt com 12 rounds

## 2. Rate Limiting

### Implementação Híbrida
- **Redis (Upstash)**: Se `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` configurados
- **In-Memory Fallback**: Map local para desenvolvimento

### Limites
- **Endpoints normais**: 60 requisições/minuto por IP
- **Endpoints sensíveis**: 20 requisições/minuto por IP
  - `/api/auth/*`
  - `/api/payments/create`
  - `/api/admin/*`
  - `/api/messages`
  - POST/PUT/DELETE em `/api/products`

### Isenções
- Webhooks (`/api/payments/webhook/*`) não sofrem rate limiting

## 3. CSRF Protection

### Mecanismo: Double Submit Cookie
- **Cookie**: `csrf-token` (não-httpOnly, SameSite=Lax)
- **Header**: `x-csrf-token` (obrigatório em requisições mutantes)
- **Validação**: Middleware compara cookie vs header

### Rotas Protegidas
- Todos os endpoints API com métodos POST/PUT/PATCH/DELETE
- **Exceções**:
  - `/api/payments/webhook/*` (verificação por assinatura)
  - `/api/auth/*` (NextAuth própria proteção CSRF)

### Client-Side
```typescript
import { getCsrfToken } from '@/lib/csrf';

const csrf = getCsrfToken();
fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrf || '',
  },
  body: JSON.stringify(data)
});
```

## 4. Proteção contra SQL Injection

### Queries Parametrizadas
- **Biblioteca**: `pg` (PostgreSQL)
- **Padrão**: Sempre usar `$1, $2...` placeholders
- **Validação**: Zod schemas server-side para tipos e formato

Exemplo:
```typescript
await client.query('SELECT * FROM users WHERE id = $1', [userId]);
```

## 5. Validação de Entradas (Zod)

### Schemas Implementados
- **Registro**: nome, email, senha, telefone, localização
- **Produtos**: título, descrição, preço, condição, categoria, imagens
- **Mensagens**: conversation_id (UUID), content (1-5000 chars)
- **Pagamentos**: product_id (UUID)

### Benefícios
- Type-safety
- Validação automática de formatos (email, UUID, URL)
- Limites de tamanho e range
- Erros descritivos

## 6. Content Security Policy (CSP)

### Headers de Segurança (next.config.ts)
```typescript
Content-Security-Policy:
  - default-src 'self'
  - img-src 'self' data: blob: https://res.cloudinary.com
  - script-src 'self' https://js.stripe.com
  - connect-src 'self' https://api.stripe.com
  - frame-src 'self' https://js.stripe.com
  - upgrade-insecure-requests (produção)

X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000 (produção)
```

## 7. Upload de Arquivos Seguro

### Cloudinary Signed Uploads
- **Endpoint**: `/api/cloudinary/sign` (server-side signature)
- **Benefício**: Impede uploads não autorizados
- **Validação**: Formatos, tamanhos e pastas controlados server-side

### Migração de Unsigned → Signed
- Antes: `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (risco de abuso)
- Agora: API interna gera signature com `CLOUDINARY_API_SECRET`

## 8. Webhooks de Pagamento

### Stripe Webhook Verification
- **Assinatura**: `stripe.webhooks.constructEvent(rawBody, sig, secret)`
- **Idempotência**: Tabela `webhook_events` com `payment_id` + `provider` + `event_type`
- **Reprocessamento**: Ignorado se `processed = true`

## 9. Auditoria Administrativa

### Tabela: `admin_audit_logs`
```sql
id UUID PRIMARY KEY,
admin_id UUID REFERENCES users(id),
action VARCHAR(50),  -- 'update', 'delete', etc.
entity VARCHAR(50),  -- 'user', 'product', 'transaction'
entity_id UUID,
details JSONB,
created_at TIMESTAMP
```

### Eventos Auditados
- Alteração de status de verificação de usuário
- Alteração de status de produto
- Remoção de produto
- (Futuro: transações, mudanças de configuração)

### Consulta de Logs
```sql
SELECT * FROM admin_audit_logs
WHERE admin_id = $1
ORDER BY created_at DESC
LIMIT 100;
```

## 10. Variáveis de Ambiente

### Obrigatórias
```bash
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=random-secret-min-32-chars
NEXTAUTH_URL=http://localhost:3000
```

### Cloudinary (Signed Uploads)
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Stripe
```bash
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Rate Limiting (Opcional - Redis)
```bash
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

## 11. Checklist de Deploy em Produção

- [ ] Gerar `NEXTAUTH_SECRET` forte (32+ chars random)
- [ ] Configurar `NEXTAUTH_URL` com domínio real
- [ ] Habilitar HTTPS e verificar `Strict-Transport-Security`
- [ ] Configurar Upstash Redis para rate limiting distribuído
- [ ] Revisar CSP para scripts inline (remover `'unsafe-inline'` se possível)
- [ ] Configurar Cloudinary para aceitar apenas uploads do domínio
- [ ] Configurar Stripe Webhook endpoint e verificar `STRIPE_WEBHOOK_SECRET`
- [ ] Monitorar logs de auditoria admin regularmente
- [ ] Configurar backup automático do banco de dados
- [ ] Implementar log aggregation (ex.: Datadog, Sentry)

## 12. Mitigações Adicionais Recomendadas

### Curto Prazo
- [ ] Adicionar 2FA para admins (Google Authenticator, etc.)
- [ ] Email de verificação para novos usuários
- [ ] Notificações de login suspeito

### Médio Prazo
- [ ] WAF (Web Application Firewall)
- [ ] DDoS protection (Cloudflare, AWS Shield)
- [ ] Penetration testing trimestral

### Longo Prazo
- [ ] SOC 2 compliance
- [ ] LGPD compliance completo (consent management)
- [ ] Bug bounty program

## 13. Resposta a Incidentes

### Contatos
- **DevOps Lead**: [seu-email]
- **Security Team**: [security@mercadodepulgas.com]

### Procedimento
1. Detectar anomalia (logs, alertas, reports)
2. Isolar sistema afetado
3. Coletar evidências (logs, dumps)
4. Notificar stakeholders
5. Remediar vulnerabilidade
6. Post-mortem e atualização de runbooks

## 14. Recursos e Ferramentas

- **NextAuth.js**: https://next-auth.js.org/
- **Zod**: https://zod.dev/
- **Upstash**: https://upstash.com/
- **Stripe Security**: https://stripe.com/docs/security
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/

---

**Última atualização**: $(date)  
**Versão**: 2.0 Enterprise
