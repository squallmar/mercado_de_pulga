# Mercado de Pulga

Marketplace de segunda mão brasileiro, inspirado no Enjoei. Conectamos pessoas que querem vender itens usados com compradores interessados.

## Stack Tecnológica

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Banco de Dados**: PostgreSQL
- **Autenticação**: NextAuth.js
- **Upload de Imagens**: Cloudinary
- **Pagamentos**: Stripe (futuro)

## Funcionalidades Principais

### Usuários
- [x] Cadastro e login de usuários
- [x] Perfis de vendedor e comprador
- [x] Sistema de autenticação com NextAuth.js
- [ ] Verificação de identidade
- [ ] Sistema de avaliações

### Produtos
- [x] API de produtos com filtros avançados
- [x] Catálogo de produtos com paginação
- [x] Sistema de categorias
- [x] Busca por texto, preço e condição
- [x] Componentes de listagem e visualização
- [ ] Upload múltiplo de imagens
- [ ] Sistema de favoritos funcionais

### Interface
- [x] Página inicial com navegação
- [x] Páginas de login e registro
- [x] Catálogo de produtos com filtros
- [x] Componentes de busca e paginação
- [x] Navegação responsiva com autenticação
- [x] Sistema de categorias funcionais

### Transações
- [ ] Sistema de ofertas
- [ ] Chat entre comprador/vendedor
- [ ] Integração com pagamentos
- [ ] Histórico de compras/vendas

### Administração
- [ ] Painel admin
- [ ] Moderação de produtos
- [ ] Relatórios de vendas
- [ ] Gestão de usuários

## Como executar

```bash
# Instalar dependências
npm install

# Configurar banco de dados PostgreSQL
# 1. Certifique-se que o PostgreSQL está rodando
# 2. Configure as variáveis de ambiente no .env.local
# 3. O banco e tabelas serão criados automaticamente

# Executar em desenvolvimento
npm run dev
```

Acesse http://localhost:3002

## Status do Desenvolvimento

✅ **Concluído:**
- Sistema completo de autenticação (login/registro)
- Banco de dados PostgreSQL configurado
- API de produtos com filtros avançados
- Catálogo de produtos com paginação
- Sistema de categorias funcionais
- Interface responsiva com navegação
- Componentes de busca e filtros

🚧 **Em desenvolvimento:**
- Upload de imagens para produtos
- Sistema de chat entre usuários
- Integração de pagamentos
- Sistema de favoritos
- Painel administrativo

## Próximos passos

1. ✅ ~~Configurar PostgreSQL~~
2. ✅ ~~Implementar autenticação~~
3. ✅ ~~Criar modelos de dados~~
4. ✅ ~~Desenvolver catálogo de produtos~~
5. 🔄 Implementar upload de imagens
6. 🔄 Sistema de ofertas e chat
7. 🔄 Integração com pagamentos
