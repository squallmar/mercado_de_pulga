import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET() {
  try {
    const client = await pool.connect();

    try {
      // Garantir que a categoria "Relógios e Joias" exista (idempotente)
      const checkRes = await client.query(
        `SELECT 1 FROM categories WHERE slug = $1 LIMIT 1`,
        ['relogios-joias']
      );

      if (checkRes.rowCount === 0) {
        await client.query(
          `INSERT INTO categories (name, slug, icon) VALUES ($1, $2, $3)
           ON CONFLICT (slug) DO NOTHING`,
          ['Relógios e Joias', 'relogios-joias', '⌚']
        );
      }

      const query = `
        SELECT c.*, 
               COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.status = 'disponivel'
        GROUP BY c.id, c.name, c.slug, c.icon, c.parent_id, c.created_at
        ORDER BY c.name ASC
      `;

      const result = await client.query(query);
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, icon, parent_id } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Nome e slug são obrigatórios' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    const query = `
      INSERT INTO categories (name, slug, icon, parent_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await client.query(query, [name, slug, icon, parent_id]);
    client.release();

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}