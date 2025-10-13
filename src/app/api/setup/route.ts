import { NextResponse } from 'next/server';
import pool from '@/lib/database';
import bcrypt from 'bcryptjs';
import { createTables } from '@/lib/database';

export async function POST() {
  try {
    const client = await pool.connect();

    try {
      // Criar tabelas se não existirem
      await createTables();

      // Verificar se já existe um usuário de teste
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        ['teste@mercadodepulgas.com']
      );

      if (existingUser.rows.length === 0) {
        // Criar usuário de teste
        const hashedPassword = await bcrypt.hash('123456', 10);
        
        await client.query(`
          INSERT INTO users (name, email, password, location, verified)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          'Usuário Teste',
          'teste@mercadodepulgas.com',
          hashedPassword,
          'São Paulo, SP',
          true
        ]);

        console.log('Usuário de teste criado com sucesso!');
      }

      return NextResponse.json({ 
        message: 'Setup concluído com sucesso!',
        testUser: {
          email: 'teste@mercadodepulgas.com',
          password: '123456'
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro no setup:', error);
    return NextResponse.json(
      { error: 'Erro no setup do banco' },
      { status: 500 }
    );
  }
}