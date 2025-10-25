// Script para criar usuário admin
// Execute com: node scripts/create-admin.js

import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:mM202038@@localhost:5432/mercadodepulgas'
});

async function createAdminUser() {
  try {
    // Gerar hash da senha
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    console.log('📧 Email: admin@mercadodepulgas.com');
    console.log('🔑 Senha:', password);
    console.log('🔐 Hash gerado:', hashedPassword);
    
    const client = await pool.connect();
    
    try {
      // Verificar se já existe
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        ['admin@mercadodepulgas.com']
      );
      
      if (existingUser.rows.length > 0) {
        console.log('⚠️  Usuário admin já existe!');
        
        // Atualizar senha se necessário
        await client.query(
          'UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2',
          [hashedPassword, 'admin@mercadodepulgas.com']
        );
        console.log('✅ Senha do admin atualizada!');
      } else {
        // Criar novo usuário admin
        const adminId = randomUUID();
        const result = await client.query(`
          INSERT INTO users (id, name, email, password, verified, role, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING id, name, email
        `, [
          adminId,
          'Administrador',
          'admin@mercadodepulgas.com',
          hashedPassword,
          true,
          'admin'
        ]);
        
        console.log('✅ Usuário admin criado com sucesso!');
        console.log('👤 Dados:', result.rows[0]);
      }
      
      console.log('\n🚀 Você pode agora fazer login com:');
      console.log('📧 Email: admin@mercadodepulgas.com');
      console.log('🔑 Senha: admin123');
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();