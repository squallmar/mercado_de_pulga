# Configuração Enterprise - Mercado de Pulgas

## Resumo Executivo

Este guia fornece instruções para configuração e deploy enterprise do Mercado de Pulgas, incluindo infraestrutura, observabilidade e compliance.

## 1. Infraestrutura Recomendada

### Ambiente de Produção
```
┌─────────────────────────────────────────┐
│         Cloudflare / CDN                │
│  (DDoS Protection, SSL, Cache)          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Load Balancer                   │
│  (Auto-scaling, Health Checks)          │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼─────┐  ┌─────▼──────┐
│ Next.js    │  │ Next.js    │
│ Instance 1 │  │ Instance 2 │
└──────┬─────┘  └─────┬──────┘
       │               │
       └───────┬───────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────┐        ┌──────▼─────┐
│ Redis  │        │ PostgreSQL │
│(Upstash)│       │ (RDS/Neon) │
└────────┘        └────────────┘
```

### Providers Recomendados
- **Hosting**: Vercel (otimizado para Next.js) ou AWS ECS/Fargate
- **Database**: Neon, AWS RDS PostgreSQL, ou Supabase
- **Redis**: Upstash Redis (serverless)
- **CDN**: Cloudflare ou Vercel Edge Network
- **Storage**: Cloudinary (imagens)

## 2. Variáveis de Ambiente por Ambiente

### Development (.env.local)
```bash
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/mercadodepulgas
NEXTAUTH_SECRET=PJO/wybOWkV0cKpXeAePTnrb5DdfVRY/STZjU5EOxhs=
NEXTAUTH_URL=http://localhost:3000

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dev-cloud
CLOUDINARY_API_KEY=dev-key
CLOUDINARY_API_SECRET=dev-secret

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Redis (opcional)
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=
```

### Production (.env.production - gerenciar via secrets manager)
```bash
NODE_ENV=production
DATABASE_URL=postgresql://prod-user:***@prod-host:5432/mercadopulgas_prod
NEXTAUTH_SECRET=PJO/wybOWkV0cKpXeAePTnrb5DdfVRY/STZjU5EOxhs=
NEXTAUTH_URL=https://mercadodepulgas.com.br

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=prod-cloud
CLOUDINARY_API_KEY=***
CLOUDINARY_API_SECRET=***

STRIPE_SECRET_KEY=sk_live_***
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_***
STRIPE_WEBHOOK_SECRET=whsec_***

UPSTASH_REDIS_REST_URL=https://***
UPSTASH_REDIS_REST_TOKEN=***
```

## 3. CI/CD Pipeline

### GitHub Actions (exemplo)
```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npx tsc --noEmit
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          # ... outras secrets
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 4. Monitoramento e Observabilidade

### Métricas Essenciais
- **Uptime**: > 99.9%
- **Response Time (p95)**: < 500ms
- **Error Rate**: < 0.1%
- **Database Connections**: monitorar pool

### Ferramentas Recomendadas
- **APM**: Datadog, New Relic, ou Vercel Analytics
- **Logs**: Logtail, Papertrail, ou CloudWatch Logs
- **Error Tracking**: Sentry
- **Uptime Monitoring**: Better Uptime, Pingdom

### Alertas Críticos
- Taxa de erro > 1% por 5 minutos
- Tempo de resposta p95 > 2s
- Rate limit excedido (possível ataque)
- Downtime > 1 minuto
- Falha de webhook Stripe

## 5. Backup e Disaster Recovery

### Database Backups
- **Frequência**: Diário (full) + contínuo (WAL/incremental)
- **Retenção**: 30 dias
- **Localização**: Cross-region (AWS S3, Google Cloud Storage)
- **Teste de Restore**: Mensal

### Disaster Recovery Plan
1. **RTO (Recovery Time Objective)**: 4 horas
2. **RPO (Recovery Point Objective)**: 1 hora
3. **Runbook**: Documentar passos de restore
4. **Drill**: Simulação trimestral

## 6. Scaling Strategy

### Horizontal Scaling
- **Next.js**: Múltiplas instâncias atrás de load balancer
- **Database**: Read replicas para queries pesadas
- **Redis**: Cluster mode para alta disponibilidade

### Vertical Scaling
- **Database**: Aumentar CPU/RAM conforme necessário
- **Redis**: Aumentar memória para cache

### Auto-scaling Triggers
- CPU > 70% por 5 minutos
- Memory > 80%
- Request queue > 100

## 7. Compliance e Conformidade

### LGPD (Lei Geral de Proteção de Dados)
- [ ] Consentimento explícito para coleta de dados
- [ ] Direito ao esquecimento (API para deletar usuário)
- [ ] Portabilidade de dados (exportação JSON)
- [ ] DPO (Data Protection Officer) designado
- [ ] Política de privacidade atualizada

### PCI-DSS (Payment Card Industry)
- [ ] Não armazenar dados de cartão (delegado ao Stripe)
- [ ] HTTPS obrigatório
- [ ] Logs de acesso a transações
- [ ] Revisão trimestral de segurança

### Audit Trail
- Todas as ações administrativas logadas em `admin_audit_logs`
- Retenção de 1 ano mínimo
- Export para SIEM (Security Information and Event Management)

## 8. Performance Optimization

### Database
```sql
-- Índices críticos
CREATE INDEX CONCURRENTLY idx_products_status_created ON products(status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_transactions_buyer ON transactions(buyer_id, created_at DESC);
```

### Caching Strategy
- **Static Pages**: ISR (Incremental Static Regeneration) - 60s
- **API Responses**: Redis cache - 30s para listagens
- **CDN**: Cache assets (imagens, CSS, JS) - 1 ano

### Image Optimization
- Cloudinary transformations: `f_auto,q_auto,w_800`
- Next.js Image component com lazy loading
- WebP/AVIF formats

## 9. Security Hardening

### Network
- [ ] VPC com subnets privadas para DB
- [ ] Security groups restritivos
- [ ] WAF rules (OWASP Core Rule Set)

### Application
- [ ] Dependências atualizadas (`npm audit`)
- [ ] Secrets rotation trimestral
- [ ] Penetration testing anual

### Database
- [ ] Encryption at rest
- [ ] Encryption in transit (SSL/TLS)
- [ ] Least privilege access (role-specific)

## 10. Custo Estimado (Mensal)

### Tier Básico (até 10k usuários)
- Vercel Pro: $20/mês
- Neon PostgreSQL: $20/mês
- Upstash Redis: $10/mês
- Cloudinary: $0-50/mês
- **Total**: ~$100/mês

### Tier Enterprise (100k+ usuários)
- AWS/GCP Compute: $500/mês
- RDS PostgreSQL (multi-AZ): $300/mês
- ElastiCache Redis: $150/mês
- Cloudinary Pro: $200/mês
- Monitoring (Datadog): $200/mês
- **Total**: ~$1,350/mês

## 11. Runbook: Incidentes Comuns

### "Site está fora do ar"
1. Verificar status do provider (Vercel status page)
2. Checar logs de aplicação (Sentry, Datadog)
3. Verificar health checks do load balancer
4. Rollback se deploy recente

### "Banco de dados lento"
1. Verificar conexões ativas (`SELECT * FROM pg_stat_activity`)
2. Identificar queries lentas (`pg_stat_statements`)
3. Adicionar índices se necessário
4. Escalar verticalmente (temporário)

### "Rate limit atingido"
1. Identificar IP origem nos logs
2. Verificar se é ataque (padrão anormal)
3. Bloquear IP no WAF se malicioso
4. Aumentar limite temporariamente se legítimo

## 12. Contacts & Escalation

### On-Call Rotation
- **Primary**: DevOps Lead
- **Secondary**: Backend Lead
- **Escalation**: CTO

### SLA Targets
- **Severity 1** (site down): < 15 min response
- **Severity 2** (degraded): < 1 hour response
- **Severity 3** (minor bug): < 24 hours response

---

**Versão**: 2.0  
**Última revisão**: 2025-10-25
