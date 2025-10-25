import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;

// Função para criar as tabelas do banco
export async function createTables() {
  const client = await pool.connect();
  
  try {
    // Tabela de usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar TEXT,
        phone VARCHAR(20),
        location VARCHAR(255),
        rating DECIMAL(2,1) DEFAULT 0,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Garantir coluna role caso a tabela já exista sem ela
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='users' AND column_name='role'
        ) THEN
          ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';
        END IF;
      END$$;
    `);

    // Tabela de categorias
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        icon VARCHAR(50),
        parent_id UUID REFERENCES categories(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Tabela de produtos
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        condition VARCHAR(20) NOT NULL CHECK (condition IN ('novo', 'seminovo', 'usado', 'para_pecas')),
        category_id UUID REFERENCES categories(id),
        seller_id UUID REFERENCES users(id),
        images TEXT[] DEFAULT '{}',
        location VARCHAR(255),
        status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'vendido', 'pausado', 'removido')),
        tags TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Tabela de favoritos
    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        product_id UUID REFERENCES products(id),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      )
    `);

    // Tabela de ofertas
    await client.query(`
      CREATE TABLE IF NOT EXISTS offers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID REFERENCES products(id),
        buyer_id UUID REFERENCES users(id),
        amount DECIMAL(10,2) NOT NULL,
        message TEXT,
        status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceita', 'rejeitada', 'cancelada')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Tabela de conversas
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID REFERENCES products(id),
        buyer_id UUID REFERENCES users(id),
        seller_id UUID REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'arquivada')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(product_id, buyer_id, seller_id)
      )
    `);

    // Tabela de mensagens
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES conversations(id),
        sender_id UUID REFERENCES users(id),
        content TEXT NOT NULL,
        type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'offer')),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Tabela de logs administrativos
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID NOT NULL REFERENCES users(id),
        action VARCHAR(50) NOT NULL,
        entity VARCHAR(50) NOT NULL,
        entity_id UUID,
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Inserir categorias padrão
    await client.query(`
      INSERT INTO categories (name, slug, icon) VALUES
        ('Moda e Beleza', 'moda-beleza', '👗'),
        ('Casa e Jardim', 'casa-jardim', '🏠'),
        ('Eletrônicos', 'eletronicos', '📱'),
        ('Esportes e Lazer', 'esportes-lazer', '⚽'),
        ('Livros e Revistas', 'livros-revistas', '📚'),
        ('Brinquedos e Jogos', 'brinquedos-jogos', '🧸'),
        ('Automóveis', 'automoveis', '🚗'),
        ('Música e Instrumentos', 'musica-instrumentos', '🎵'),
        ('Relógios e Joias', 'relogios-joias', '⌚')
      ON CONFLICT (slug) DO NOTHING
    `);

    console.log('Tabelas criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
    throw error;
  } finally {
    client.release();
  }
}