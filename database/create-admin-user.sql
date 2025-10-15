-- Script para criar usuário admin
-- Execute este comando no seu banco PostgreSQL

-- Inserir usuário admin (se não existir)
INSERT INTO users (id, name, email, password, verified, created_at, updated_at)
VALUES (
  'admin-user-id-001',
  'Administrador',
  'admin@mercadodepulgas.com',
  '$2b$12$LQv3c1yqBwlVHpPjrGQ8dePxQj7J8cF2l1yYzWn8bZ5Zq8FfGqDQ6', -- senha: admin123 (hash bcrypt)
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Verificar se o usuário foi criado
SELECT id, name, email, verified FROM users WHERE email = 'admin@mercadodepulgas.com';