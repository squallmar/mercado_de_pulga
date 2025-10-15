import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    // Verificar se é admin
    if (!token?.email || token.email !== 'admin@mercadodepulgas.com') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    const client = await pool.connect();
    
    try {
      let query = `
        SELECT 
          t.*,
          p.title as product_title,
          ub.name as buyer_name,
          us.name as seller_name
        FROM transactions t
        JOIN products p ON t.product_id = p.id
        JOIN users ub ON t.buyer_id = ub.id
        JOIN users us ON t.seller_id = us.id
      `;
      
      const params: (string | number)[] = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        query += ` WHERE t.status = $${paramCount}`;
        params.push(status);
      }

      query += ` ORDER BY t.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      // Buscar total de transações
      let countQuery = 'SELECT COUNT(*) as total FROM transactions';
      const countParams: string[] = [];
      
      if (status) {
        countQuery += ' WHERE status = $1';
        countParams.push(status);
      }
      
      const countResult = await client.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      return NextResponse.json({
        transactions: result.rows,
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
    console.error('Erro ao buscar transações:', error);
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
    if (!token?.email || token.email !== 'admin@mercadodepulgas.com') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('id');
    
    if (!transactionId) {
      return NextResponse.json({ error: 'ID da transação é obrigatório' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        UPDATE transactions 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [status, transactionId]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
      }

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}