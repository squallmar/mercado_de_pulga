import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    // Verificar se é admin
    if (!token?.role || token.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT id, name, email, verified, rating, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      // Buscar total de usuários
      const countResult = await client.query('SELECT COUNT(*) as total FROM users');
      const total = parseInt(countResult.rows[0].total);

      return NextResponse.json({
        users: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    // Verificar se é admin
    if (!token?.role || token.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    const body = await request.json();
    const { verified } = body;

    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        UPDATE users 
        SET verified = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, name, email, verified
      `, [verified, userId]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }

      // Audit log
      await client.query(
        `INSERT INTO admin_audit_logs (admin_id, action, entity, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [token.id, 'update', 'user', userId, JSON.stringify({ verified })]
      );

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}