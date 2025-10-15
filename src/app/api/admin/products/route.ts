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
        SELECT p.*, u.name as seller_name, c.name as category_name
        FROM products p
        JOIN users u ON p.seller_id = u.id
        JOIN categories c ON p.category_id = c.id
      `;
      
      const params: (string | number)[] = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        query += ` WHERE p.status = $${paramCount}`;
        params.push(status);
      }

      query += ` ORDER BY p.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      // Buscar total de produtos
      let countQuery = 'SELECT COUNT(*) as total FROM products';
      const countParams: string[] = [];
      
      if (status) {
        countQuery += ' WHERE status = $1';
        countParams.push(status);
      }
      
      const countResult = await client.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      // Parsear imagens
      const products = result.rows.map(product => {
        if (typeof product.images === 'string') {
          try {
            product.images = JSON.parse(product.images);
          } catch {
            product.images = [];
          }
        }
        return product;
      });

      return NextResponse.json({
        products,
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
    console.error('Erro ao buscar produtos:', error);
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
    const productId = searchParams.get('id');
    
    if (!productId) {
      return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        UPDATE products 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [status, productId]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
      }

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    // Verificar se é admin
    if (!token?.email || token.email !== 'admin@mercadodepulgas.com') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    
    if (!productId) {
      return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      // Marcar como removido ao invés de deletar
      const result = await client.query(`
        UPDATE products 
        SET status = 'removido', updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [productId]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Produto removido com sucesso' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao remover produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}