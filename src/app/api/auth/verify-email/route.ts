import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Token de verificação não fornecido' },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    // Buscar usuário pelo token
    const userResult = await client.query(
      `SELECT id, email, email_verification_expires 
       FROM users 
       WHERE email_verification_token = $1 AND email_verified = false`,
      [token]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Token inválido ou e-mail já verificado' },
        { status: 400 }
      );
    }

    const user = userResult.rows[0];

    // Verificar se o token expirou
    if (new Date() > new Date(user.email_verification_expires)) {
      return NextResponse.json(
        { error: 'Token expirado. Solicite um novo e-mail de verificação.' },
        { status: 400 }
      );
    }

    // Marcar e-mail como verificado
    await client.query(
      `UPDATE users 
       SET email_verified = true, 
           email_verification_token = NULL,
           email_verification_expires = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [user.id]
    );

    // Redirecionar para página de sucesso
    return NextResponse.redirect(
      new URL('/auth/login?verified=true', request.url)
    );
  } catch (error) {
    console.error('Erro ao verificar e-mail:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar e-mail' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
