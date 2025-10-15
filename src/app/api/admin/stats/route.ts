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

    const client = await pool.connect();
    
    try {
      // Buscar estatísticas gerais
      const [usersResult, productsResult, transactionsResult, revenueResult] = await Promise.all([
        client.query('SELECT COUNT(*) as total FROM users'),
        client.query('SELECT COUNT(*) as total FROM products WHERE status = $1', ['disponivel']),
        client.query('SELECT COUNT(*) as total FROM transactions'),
        client.query('SELECT COALESCE(SUM(platform_fee), 0) as total FROM transactions WHERE status = $1', ['paid'])
      ]);

      // Buscar usuários recentes
      const recentUsersResult = await client.query(`
        SELECT id, name, email, created_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 5
      `);

      // Buscar produtos recentes
      const recentProductsResult = await client.query(`
        SELECT p.id, p.title, p.price, u.name as seller_name
        FROM products p
        JOIN users u ON p.seller_id = u.id
        ORDER BY p.created_at DESC 
        LIMIT 5
      `);

      // Buscar transações recentes
      const recentTransactionsResult = await client.query(`
        SELECT t.id, t.amount, t.status, t.created_at, p.title as product_title
        FROM transactions t
        JOIN products p ON t.product_id = p.id
        ORDER BY t.created_at DESC 
        LIMIT 5
      `);

      const stats = {
        totalUsers: parseInt(usersResult.rows[0].total),
        totalProducts: parseInt(productsResult.rows[0].total),
        totalTransactions: parseInt(transactionsResult.rows[0].total),
        totalRevenue: parseFloat(revenueResult.rows[0].total),
        recentUsers: recentUsersResult.rows,
        recentProducts: recentProductsResult.rows,
        recentTransactions: recentTransactionsResult.rows
      };

      return NextResponse.json(stats);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas admin:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}