# Sistema de Verificação de E-mail

## Visão Geral

Sistema de verificação de e-mail para novos usuários, garantindo que apenas e-mails válidos sejam utilizados na plataforma.

## Fluxo de Verificação

### 1. **Registro de Usuário**

**Endpoint:** `POST /api/auth/register`

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123",
  "phone": "+55 11 98765-4321",
  "location": "São Paulo, SP"
}
```

**Resposta:**
```json
{
  "message": "Usuário cadastrado com sucesso! Verifique seu e-mail para ativar sua conta.",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "+55 11 98765-4321",
    "location": "São Paulo, SP",
    "verified": false,
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

**Processo Backend:**
1. Validar dados com Zod
2. Verificar se e-mail já existe
3. Hash da senha (bcrypt com 12 rounds)
4. Gerar token de verificação aleatório (32 bytes hex = 64 caracteres)
5. Definir expiração do token (24 horas)
6. Inserir usuário no banco com `email_verified = false`
7. Enviar e-mail de verificação via `sendVerificationEmail()`

### 2. **E-mail de Verificação**

**Assunto:** Verificação de E-mail - Mercado de Pulgas

**Conteúdo:**
```html
Olá {name},

Obrigado por se cadastrar no Mercado de Pulgas. Para ativar sua conta, clique no botão abaixo:

[Verificar E-mail]

Ou copie e cole este link no seu navegador:
{NEXTAUTH_URL}/api/auth/verify-email?token={token}

Este link expira em 24 horas.

Se você não criou esta conta, pode ignorar este e-mail.
```

### 3. **Verificação do Token**

**Endpoint:** `GET /api/auth/verify-email?token={token}`

**Resposta (Sucesso):**
- Redireciona para `/auth/login?verified=true`

**Resposta (Token Inválido):**
```json
{
  "error": "Token inválido ou e-mail já verificado"
}
```

**Resposta (Token Expirado):**
```json
{
  "error": "Token expirado. Solicite um novo e-mail de verificação."
}
```

**Processo Backend:**
1. Buscar usuário pelo token
2. Verificar se `email_verified = false`
3. Verificar se `email_verification_expires > NOW()`
4. Marcar `email_verified = true`
5. Limpar `email_verification_token` e `email_verification_expires`

### 4. **Login com E-mail Não Verificado**

**Proteção no NextAuth:**

Se usuário tentar fazer login sem verificar e-mail:
```typescript
if (user.email_verified === false) {
  throw new Error('EMAIL_NOT_VERIFIED');
}
```

**Tratamento no Frontend:**
```typescript
const result = await signIn('credentials', {
  redirect: false,
  email,
  password
});

if (result?.error === 'EMAIL_NOT_VERIFIED') {
  alert('Por favor, verifique seu e-mail antes de fazer login.');
  router.push('/auth/verify-email-prompt');
}
```

## Campos no Banco de Dados

### Tabela `users`

```sql
-- Flag indicando se e-mail foi verificado
email_verified BOOLEAN DEFAULT false,

-- Token único para verificação (64 caracteres hex)
email_verification_token TEXT NULL,

-- Data de expiração do token (24h após criação)
email_verification_expires TIMESTAMP NULL,
```

## Reenvio de E-mail de Verificação

**TODO:** Implementar endpoint para reenviar e-mail

**Endpoint:** `POST /api/auth/resend-verification`

**Body:**
```json
{
  "email": "joao@example.com"
}
```

**Processo:**
1. Verificar se usuário existe
2. Verificar se `email_verified = false`
3. Gerar novo token
4. Atualizar `email_verification_token` e `email_verification_expires`
5. Enviar novo e-mail

**Rate Limiting:** Limitar a 1 reenvio a cada 5 minutos por e-mail

## Configuração de E-mail (SMTP)

### Variáveis de Ambiente

```env
# Servidor SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false  # true para porta 465, false para 587

# Autenticação
SMTP_USER=noreply@mercadodepulgas.com
SMTP_PASS=sua-senha-smtp

# Remetente
SMTP_FROM=noreply@mercadodepulgas.com
SMTP_FROM_NAME=Mercado de Pulgas
```

### Provedores SMTP Recomendados

#### Gmail (Desenvolvimento)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=senha-de-app  # Criar em https://myaccount.google.com/apppasswords
```

#### SendGrid (Produção)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxx  # API Key do SendGrid
```

#### Amazon SES (Produção)
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

#### Mailgun (Produção)
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.yourdomain.com
SMTP_PASS=sua-senha-mailgun
```

## Testes

### Teste de Registro (cURL)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste User",
    "email": "teste@example.com",
    "password": "senha123"
  }'
```

### Teste de Verificação
1. Copiar token do console ou banco de dados
2. Acessar `http://localhost:3000/api/auth/verify-email?token={TOKEN}`

### Teste com MailHog (Desenvolvimento Local)

MailHog é um servidor SMTP falso que captura e-mails para testes:

```bash
# Instalar MailHog
brew install mailhog  # macOS
# ou
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog  # Docker

# Configurar .env.local
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=

# Acessar interface web
http://localhost:8025
```

## Segurança

- **Token:** 32 bytes aleatórios (256 bits de entropia)
- **Expiração:** 24 horas
- **Uso único:** Token é removido após verificação bem-sucedida
- **Proteção contra login:** Usuários não verificados não podem fazer login
- **Rate limiting:** Reenvio de e-mail limitado a 1/5min

## Melhorias Futuras

### 1. **Verificação em Duas Etapas**
- Primeiro: verificar e-mail
- Depois: completar perfil

### 2. **E-mail de Boas-Vindas**
Após verificação, enviar e-mail de boas-vindas com:
- Primeiros passos na plataforma
- Links úteis
- Dicas de segurança

### 3. **Avisos de Mudança de E-mail**
Se usuário mudar o e-mail:
- Enviar confirmação para o e-mail antigo
- Enviar verificação para o e-mail novo
- Exigir senha atual

### 4. **Verificação Periódica**
Solicitar re-verificação de e-mail:
- A cada 1 ano
- Após mudanças críticas de segurança

## Monitoramento

### Métricas Importantes

- **Taxa de verificação:** % de usuários que verificam e-mail
- **Tempo médio de verificação:** quanto tempo entre registro e verificação
- **E-mails bounced:** quantos e-mails falharam
- **Taxa de reenvio:** quantos usuários precisam reenviar

### Logs

```typescript
console.log('📧 E-mail de verificação enviado para:', email);
console.log('✅ E-mail verificado com sucesso:', email);
console.error('❌ Erro ao enviar e-mail para:', email, error);
```

## Compliance (LGPD/GDPR)

- Informar usuário sobre uso do e-mail
- Permitir alteração de e-mail
- Deletar dados ao excluir conta
- Não compartilhar e-mails com terceiros sem consentimento

## Exemplo de UI

### Página de Registro

```tsx
// src/app/auth/register/page.tsx
const handleSubmit = async (data) => {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (res.ok) {
    router.push('/auth/verify-email-sent');
  }
};
```

### Página de Confirmação

```tsx
// src/app/auth/verify-email-sent/page.tsx
export default function VerifyEmailSent() {
  return (
    <div>
      <h1>Verifique seu E-mail</h1>
      <p>Enviamos um link de verificação para {email}.</p>
      <p>Clique no link para ativar sua conta.</p>
      <button onClick={resendEmail}>Reenviar E-mail</button>
    </div>
  );
}
```

### Página de Login com Aviso

```tsx
// src/app/auth/login/page.tsx
const { verified } = useSearchParams();

if (verified === 'true') {
  return <Alert>E-mail verificado! Agora você pode fazer login.</Alert>;
}
```

## Referências

- [Nodemailer Documentation](https://nodemailer.com/)
- [SMTP Configuration Examples](https://nodemailer.com/smtp/)
- [SendGrid SMTP Integration](https://sendgrid.com/docs/for-developers/sending-email/integrating-with-the-smtp-api/)
