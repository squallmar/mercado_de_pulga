import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { getToken } from 'next-auth/jwt';

// GET /api/favorites -> lista produtos favoritados do usuário logado
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT p.*
         FROM favorites f
         JOIN products p ON p.id = f.product_id
         WHERE f.user_id = $1
         ORDER BY f.created_at DESC`,
        [token.id]
      );

      return NextResponse.json({ products: result.rows });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('GET /api/favorites error', err);
    return NextResponse.json({ error: 'Erro ao buscar favoritos' }, { status: 500 });
  }
}

// POST /api/favorites -> adiciona um produto aos favoritos { product_id }
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
      await client.query(
        `INSERT INTO favorites (user_id, product_id) VALUES ($1, $2)
         ON CONFLICT (user_id, product_id) DO NOTHING`,
        [token.id, product_id]
      );
      return NextResponse.json({ ok: true });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('POST /api/favorites error', err);
    return NextResponse.json({ error: 'Erro ao adicionar favorito' }, { status: 500 });
  }
}

// DELETE /api/favorites?product_id=... -> remove um produto dos favoritos
export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const product_id = searchParams.get('product_id');
    if (!product_id) {
      return NextResponse.json({ error: 'product_id é obrigatório' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query(
        `DELETE FROM favorites WHERE user_id = $1 AND product_id = $2`,
        [token.id, product_id]
      );
      return NextResponse.json({ ok: true });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('DELETE /api/favorites error', err);
    return NextResponse.json({ error: 'Erro ao remover favorito' }, { status: 500 });
  }
}
