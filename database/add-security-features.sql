-- Migração: Adicionar campos de 2FA e verificação de e-mail
-- Data: 2025-01-15
-- Descrição: Adiciona suporte para autenticação de dois fatores e verificação de e-mail

-- Adicionar campos de 2FA
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;

-- Adicionar campos de verificação de e-mail
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;

-- Criar tabela de tentativas de login
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  email VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);

-- Marcar e-mails de usuários antigos como verificados (retroativo)
UPDATE users SET email_verified = true WHERE email_verified IS NULL;

-- Verificar migração
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN two_factor_enabled = true THEN 1 END) as users_with_2fa,
  COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_emails
FROM users;

SELECT 
  COUNT(*) as total_login_attempts,
  COUNT(CASE WHEN success = true THEN 1 END) as successful_logins,
  COUNT(CASE WHEN success = false THEN 1 END) as failed_logins
FROM login_attempts;
