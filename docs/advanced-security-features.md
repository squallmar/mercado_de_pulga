# Recursos de Segurança Avançados - Implementados

## 📊 Status de Implementação

### ✅ Concluído

1. **Sentry - Error Tracking**
   - Configurações client/server/edge criadas
   - Integração com Next.js via instrumentation.ts
   - CSP atualizado para permitir conexões Sentry

2. **Autenticação de Dois Fatores (2FA)**
   - Sistema TOTP baseado em `speakeasy`
   - Endpoints de setup, verificação e desativação
   - Geração de QR Code para apps autenticadores
   - Documentação completa em `docs/2fa-guide.md`

3. **Verificação de E-mail**
   - Token de verificação (32 bytes, 24h de validade)
   - E-mails HTML responsivos via nodemailer
   - Endpoint de verificação com redirecionamento
   - Bloqueio de login para e-mails não verificados (opcional)
   - Documentação completa em `docs/email-verification-guide.md`

4. **Sistema de E-mail (Nodemailer)**
   - Transporter SMTP configurável
   - Templates HTML profissionais para:
     - Verificação de e-mail
     - Alerta de login suspeito
     - Confirmação de 2FA
   - Suporte para Gmail, SendGrid, Amazon SES, Mailgun

5. **Rastreamento de Login (login_attempts)**
   - Tabela para registrar todas as tentativas
   - Campos: user_id, email, IP, user_agent, success, failure_reason
   - Índices otimizados para consultas rápidas
   - Base para detecção de login suspeito

### 🚧 Parcialmente Implementado

6. **Detecção de Login Suspeito**
   - Código preparado no NextAuth (comentado temporariamente)
   - Lógica: detectar novo IP ou múltiplas falhas
   - Envio de alerta via `sendSuspiciousLoginAlert()`
   - **TODO:** Integrar com serviço de geolocalização de IP

## 📦 Dependências Adicionadas

```json
{
  "@sentry/nextjs": "^X.X.X",
  "nodemailer": "^X.X.X",
  "speakeasy": "^X.X.X",
  "qrcode": "^X.X.X"
}
```

```json
{
  "@types/nodemailer": "^X.X.X",
  "@types/qrcode": "^X.X.X",
  "@types/speakeasy": "^X.X.X"
}
```

## 🗄️ Alterações no Banco de Dados

### Tabela `users` - Novos Campos

```sql
-- Autenticação de Dois Fatores
two_factor_secret TEXT,                  -- Segredo TOTP (base32)
two_factor_enabled BOOLEAN DEFAULT false, -- Flag de ativação

-- Verificação de E-mail
email_verified BOOLEAN DEFAULT false,                -- Status de verificação
email_verification_token TEXT,                       -- Token único (64 chars hex)
email_verification_expires TIMESTAMP,                -- Expiração do token (24h)
```

### Nova Tabela `login_attempts`

```sql
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  email VARCHAR(255),
  ip_address VARCHAR(45),          -- IPv4 ou IPv6
  user_agent TEXT,                  -- Browser/dispositivo
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(100),      -- user_not_found, invalid_password, 2fa_required, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
```

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

```
sentry.client.config.ts          - Configuração Sentry para client-side
sentry.server.config.ts          - Configuração Sentry para server-side
sentry.edge.config.ts            - Configuração Sentry para edge runtime
instrumentation.ts               - Registro de instrumentação Next.js
src/lib/email.ts                 - Funções de envio de e-mail
src/app/api/auth/verify-email/route.ts         - Verificação de e-mail
src/app/api/auth/2fa/setup/route.ts            - Configurar 2FA
src/app/api/auth/2fa/verify/route.ts           - Verificar código 2FA
src/app/api/auth/2fa/disable/route.ts          - Desativar 2FA
docs/2fa-guide.md                              - Documentação completa 2FA
docs/email-verification-guide.md               - Documentação verificação e-mail
database/add-security-features.sql             - Migração SQL
.env.example                                   - Template de variáveis de ambiente
```

### Arquivos Modificados

```
src/lib/database.ts                - Campos de 2FA, verificação e login_attempts
src/app/api/auth/register/route.ts - Adicionado envio de e-mail de verificação
src/app/api/auth/[...nextauth]/route.ts - Campos de sessão 2FA/email_verified, export authOptions
next.config.ts                     - Sentry adicionado ao CSP
```

## 🔐 Variáveis de Ambiente Necessárias

### Sentry (Error Tracking)
```env
SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/123456
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/123456
```

### SMTP (E-mail)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@mercadodepulgas.com
SMTP_PASS=sua-senha-ou-app-password
SMTP_FROM=noreply@mercadodepulgas.com
SMTP_FROM_NAME=Mercado de Pulgas
```

## 🚀 Próximos Passos

### Configuração Inicial

1. **Configurar Sentry**
   ```bash
   # Criar conta em https://sentry.io
   # Criar novo projeto Next.js
   # Copiar DSN e adicionar ao .env
   ```

2. **Configurar SMTP**
   - **Desenvolvimento:** Gmail com App Password
   - **Produção:** SendGrid, Amazon SES ou Mailgun
   - Adicionar credenciais ao `.env`

3. **Executar Migração**
   ```bash
   psql $DATABASE_URL -f database/add-security-features.sql
   ```

### Implementações Futuras

1. **Códigos de Backup 2FA**
   - Gerar 10 códigos de 8 dígitos no setup
   - Armazenar hasheados em tabela `backup_codes`
   - Permitir uso no login
   - Invalidar após uso

2. **Reenvio de E-mail de Verificação**
   - Endpoint `POST /api/auth/resend-verification`
   - Rate limiting: 1 reenvio a cada 5 minutos
   - Gerar novo token e atualizar expiração

3. **Geolocalização de IP**
   - Integrar com ipapi.co ou ipgeolocation.io
   - Detectar país/cidade do login
   - Incluir no alerta de login suspeito
   - Permitir usuário visualizar logins recentes

4. **Dashboard de Segurança**
   - Página `/profile/security` para usuários
   - Histórico de logins (últimos 30 dias)
   - Gerenciar 2FA (ativar/desativar)
   - Visualizar sessões ativas
   - Revogar sessões remotamente

5. **Notificações em Tempo Real**
   - WebSocket ou Server-Sent Events
   - Alertas de novo login
   - Notificações de atividades suspeitas

## 🧪 Testes Recomendados

### 2FA
```bash
# 1. Setup
curl -X POST http://localhost:3000/api/auth/2fa/setup \
  -H "Cookie: next-auth.session-token=TOKEN"

# 2. Escanear QR Code com Google Authenticator

# 3. Verificar código
curl -X POST http://localhost:3000/api/auth/2fa/verify \
  -H "Cookie: next-auth.session-token=TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"123456","enable":true}'
```

### Verificação de E-mail
```bash
# 1. Registrar usuário
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"123456"}'

# 2. Copiar token do console ou banco

# 3. Verificar
curl http://localhost:3000/api/auth/verify-email?token=TOKEN
```

### Teste Local de E-mail (MailHog)
```bash
# Rodar MailHog
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Configurar .env.local
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=

# Acessar interface
http://localhost:8025
```

## 📊 Métricas de Sucesso

- **Taxa de Adoção de 2FA:** Meta 80% dos admins em 30 dias
- **Taxa de Verificação de E-mail:** Meta 90% em 24h
- **Tempo Médio de Verificação:** Meta <10 minutos
- **Falsos Positivos de Login Suspeito:** Meta <5%
- **Erros Capturados pelo Sentry:** Monitorar para <0.1% de requisições

## 🔒 Segurança Adicional

- **TOTP Window:** ±2 períodos (2 minutos de tolerância)
- **Token de E-mail:** 256 bits de entropia (32 bytes hex)
- **Expiração de Token:** 24 horas
- **Rate Limiting:** Já aplicado via middleware (60/min geral, 20/min sensível)
- **HTTPS Only:** Cookies com flag `secure` em produção

## 📚 Referências

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Speakeasy (TOTP)](https://github.com/speakeasyjs/speakeasy)
- [Nodemailer Documentation](https://nodemailer.com/)
- [RFC 6238 - TOTP](https://tools.ietf.org/html/rfc6238)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
