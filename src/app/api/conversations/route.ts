import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { getToken } from 'next-auth/jwt';

// GET /api/conversations -> lista conversas do usuário logado
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT DISTINCT ON (c.id) 
                c.id, c.product_id, c.buyer_id, c.seller_id, c.status, c.created_at, c.updated_at,
                p.title as product_title, p.price as product_price, p.images as product_images,
                CASE 
                  WHEN c.buyer_id = $1 THEN u_seller.name 
                  ELSE u_buyer.name 
                END as other_user_name,
                CASE 
                  WHEN c.buyer_id = $1 THEN u_seller.id 
                  ELSE u_buyer.id 
                END as other_user_id,
                m.content as last_message, 
                m.created_at as last_message_time,
                m.sender_id as last_message_sender_id
         FROM conversations c
         JOIN products p ON p.id = c.product_id
         JOIN users u_buyer ON u_buyer.id = c.buyer_id
         JOIN users u_seller ON u_seller.id = c.seller_id
         LEFT JOIN messages m ON m.conversation_id = c.id 
         WHERE (c.buyer_id = $1 OR c.seller_id = $1)
         ORDER BY c.id, m.created_at DESC NULLS LAST`,
        [token.id]
      );

      return NextResponse.json({ conversations: result.rows });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('GET /api/conversations error', err);
    return NextResponse.json({ error: 'Erro ao buscar conversas' }, { status: 500 });
  }
}

// POST /api/conversations -> criar nova conversa { product_id }
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { product_id } = body as { product_id?: string };
    if (!product_id) {
      return NextResponse.json({ error: 'product_id é obrigatório' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // Get product and seller info
      const productResult = await client.query(
        'SELECT seller_id FROM products WHERE id = $1',
        [product_id]
      );
      
      if (productResult.rows.length === 0) {
        return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
      }

      const seller_id = productResult.rows[0].seller_id;
      
      if (seller_id === token.id) {
        return NextResponse.json({ error: 'Não é possível conversar com você mesmo' }, { status: 400 });
      }

      // Check if conversation already exists
      const existingResult = await client.query(
        'SELECT * FROM conversations WHERE product_id = $1 AND buyer_id = $2 AND seller_id = $3',
        [product_id, token.id, seller_id]
      );

      if (existingResult.rows.length > 0) {
        return NextResponse.json({ 
          conversation: existingResult.rows[0],
          message: 'Conversa já existe'
        });
      }

      // Create new conversation
      const result = await client.query(
        `INSERT INTO conversations (product_id, buyer_id, seller_id) 
         VALUES ($1, $2, $3)
         RETURNING *`,
        [product_id, token.id, seller_id]
      );

      return NextResponse.json({ 
        conversation: result.rows[0],
        message: 'Conversa criada com sucesso'
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('POST /api/conversations error', err);
    return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 });
  }
}