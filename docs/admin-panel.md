# Painel Administrativo - Mercado de Pulgas

## Como acessar

1. **Criar usuário admin no banco:**
   Execute o script SQL localizado em `database/create-admin-user.sql`

2. **Fazer login:**
   - Email: `admin@mercadodepulgas.com`
   - Senha: `admin123`

3. **Acessar o painel:**
   - No menu do usuário, clique em "🔧 Admin"
   - Ou acesse diretamente: `http://localhost:3000/admin`

## Funcionalidades

### 📊 Visão Geral
- Estatísticas gerais do marketplace
- Total de usuários, produtos, transações e receita
- Atividade recente (usuários, produtos e transações)

### 👥 Gerenciar Usuários
- Lista todos os usuários cadastrados
- Visualizar status de verificação
- Editar informações de usuários
- Paginação automática

### 📦 Gerenciar Produtos
- Lista todos os produtos da plataforma
- Filtrar por status (disponível, vendido, pausado, removido)
- Remover produtos inadequados
- Visualizar vendedor e categoria

### 💰 Gerenciar Transações
- Lista todas as transações
- Filtrar por status (pending, paid, failed, etc.)
- Visualizar valor total e taxa da plataforma
- Acompanhar histórico de pagamentos

## Segurança

- ✅ Acesso restrito apenas para `admin@mercadodepulgas.com`
- ✅ Verificação de autenticação em todas as rotas
- ✅ APIs protegidas com middleware de autorização
- ✅ Não permite operações destrutivas (soft delete)

## APIs Administrativas

### GET /api/admin/stats
Retorna estatísticas gerais do marketplace

### GET /api/admin/users
Lista usuários com paginação

### PUT /api/admin/users?id={userId}
Atualiza dados de usuário (ex: verificação)

### GET /api/admin/products
Lista produtos com filtros

### PUT /api/admin/products?id={productId}
Atualiza status do produto

### DELETE /api/admin/products?id={productId}
Remove produto (soft delete)

### GET /api/admin/transactions
Lista transações com filtros

### PUT /api/admin/transactions?id={transactionId}
Atualiza status da transação

## Personalização

Para adicionar novos administradores, modifique a verificação de email nos arquivos:
- `src/app/admin/page.tsx`
- `src/app/api/admin/*/route.ts`
- `src/components/Navigation.tsx`

## Estilo Visual

O painel administrativo segue o mesmo tema vintage do marketplace com:
- Paleta de cores consistente
- Tipografia vintage
- Cards com bordas arredondadas e sombras
- Responsividade para mobile