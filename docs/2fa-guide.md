# Autenticação de Dois Fatores (2FA)

## Visão Geral

Sistema de autenticação de dois fatores (2FA) baseado em TOTP (Time-based One-Time Password) para aumentar a segurança das contas de usuários, especialmente administradores.

## Fluxo de Implementação

### 1. **Configuração Inicial (Setup)**

**Endpoint:** `POST /api/auth/2fa/setup`

**Headers:**
```
Authorization: Bearer {session-token}
```

**Resposta:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,...",
  "otpauthUrl": "otpauth://totp/Mercado%20de%20Pulgas%20(user@example.com)?secret=JBSWY3DPEHPK3PXP&issuer=Mercado%20de%20Pulgas"
}
```

**Ações do Cliente:**
1. Exibir QR Code para o usuário escanear com app autenticador (Google Authenticator, Authy, etc.)
2. Permitir copiar o `secret` manualmente caso não consiga escanear
3. Solicitar que o usuário insira um código do autenticador para confirmar

### 2. **Ativação do 2FA (Verify)**

**Endpoint:** `POST /api/auth/2fa/verify`

**Headers:**
```
Authorization: Bearer {session-token}
```

**Body:**
```json
{
  "token": "123456",
  "enable": true
}
```

**Resposta (Sucesso):**
```json
{
  "success": true,
  "message": "2FA ativado com sucesso",
  "enabled": true
}
```

**Resposta (Código Inválido):**
```json
{
  "error": "Código inválido ou expirado"
}
```

### 3. **Desativação do 2FA (Disable)**

**Endpoint:** `POST /api/auth/2fa/disable`

**Headers:**
```
Authorization: Bearer {session-token}
```

**Body:**
```json
{
  "token": "123456"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "2FA desativado com sucesso"
}
```

## Integração com NextAuth

### Login com 2FA

Quando um usuário com 2FA ativado tenta fazer login:

1. **Primeiro passo:** Validação de e-mail/senha
   - Se credenciais corretas mas `two_factor_enabled = true`, NextAuth lança exceção `2FA_REQUIRED`
   - Cliente deve redirecionar para tela de inserção do código 2FA

2. **Segundo passo:** Validação do código TOTP
   - Cliente envia código para `/api/auth/2fa/verify` (sem `enable: true`)
   - Se válido, permitir login completo

### Exemplo de Fluxo no Frontend

```typescript
// 1. Tentar login
const result = await signIn('credentials', {
  redirect: false,
  email,
  password
});

if (result?.error === '2FA_REQUIRED') {
  // 2. Mostrar modal para código 2FA
  const twoFactorCode = await promptUser2FA();
  
  // 3. Verificar código
  const verifyRes = await fetch('/api/auth/2fa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: twoFactorCode })
  });
  
  if (verifyRes.ok) {
    // 4. Login completo
    router.push('/dashboard');
  }
}
```

## Campos no Banco de Dados

### Tabela `users`

```sql
-- Segredo TOTP (base32)
two_factor_secret TEXT NULL,

-- Flag indicando se 2FA está ativado
two_factor_enabled BOOLEAN DEFAULT false,
```

## Apps Autenticadores Compatíveis

- Google Authenticator (iOS/Android)
- Microsoft Authenticator (iOS/Android)
- Authy (iOS/Android/Desktop)
- 1Password (com suporte a TOTP)
- Bitwarden (com suporte a TOTP)

## Códigos de Backup (Recomendado)

Para evitar lock-out caso o usuário perca acesso ao autenticador:

1. Gerar 10 códigos de backup de 8 dígitos no setup
2. Armazenar hasheados no banco (tabela `backup_codes`)
3. Permitir uso de códigos de backup no login
4. Invalidar código após uso
5. Alertar usuário quando restarem poucos códigos

**TODO:** Implementar sistema de códigos de backup

## Recuperação de Conta

Se usuário perder acesso ao 2FA:

1. **Opção 1:** Códigos de backup (se implementado)
2. **Opção 2:** Contato com suporte
   - Verificar identidade (e-mail, documentos, etc.)
   - Administrador desativa 2FA manualmente via SQL ou painel admin

## Segurança

- **Window de validação:** ±2 períodos (60 segundos cada) = ±2 minutos de tolerância
- **Rate limiting:** Middleware limita tentativas de verificação (60/min geral, 20/min para 2FA)
- **Segredo:** 32 caracteres base32, gerado aleatoriamente com `speakeasy`
- **Algoritmo:** HMAC-SHA1 (padrão TOTP RFC 6238)

## Notificações por E-mail

Ao ativar 2FA, usuário recebe e-mail de confirmação via `send2FASetupEmail()`.

## Exemplo de UI (Admin Dashboard)

```tsx
// src/app/admin/security/page.tsx
export default function SecurityPage() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  const setup2FA = async () => {
    const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
    const data = await res.json();
    setQrCode(data.qrCode);
    setSecret(data.secret);
  };

  const enable2FA = async () => {
    const res = await fetch('/api/auth/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verificationCode, enable: true })
    });
    
    if (res.ok) {
      alert('2FA ativado com sucesso!');
      setQrCode(null);
    } else {
      alert('Código inválido');
    }
  };

  return (
    <div>
      <h1>Configurações de Segurança</h1>
      {!qrCode ? (
        <button onClick={setup2FA}>Ativar 2FA</button>
      ) : (
        <>
          <img src={qrCode} alt="QR Code" />
          <p>Segredo: <code>{secret}</code></p>
          <input
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Código do autenticador"
            maxLength={6}
          />
          <button onClick={enable2FA}>Confirmar</button>
        </>
      )}
    </div>
  );
}
```

## Testes

### Testar Setup
```bash
curl -X POST http://localhost:3000/api/auth/2fa/setup \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Testar Verificação
```bash
curl -X POST http://localhost:3000/api/auth/2fa/verify \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"123456","enable":true}'
```

### Testar com Google Authenticator

1. Escaneie o QR Code retornado pelo setup
2. Insira o código de 6 dígitos exibido
3. Código muda a cada 30 segundos

## Referências

- [RFC 6238 - TOTP](https://tools.ietf.org/html/rfc6238)
- [Speakeasy Documentation](https://github.com/speakeasyjs/speakeasy)
- [Google Authenticator](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2)
