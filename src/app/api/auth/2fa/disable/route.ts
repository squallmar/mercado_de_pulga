import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import pool from '@/lib/database';
import speakeasy from 'speakeasy';
import { z } from 'zod';

const DisableSchema = z.object({
  token: z.string().length(6, 'Código deve ter 6 dígitos'),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const client = await pool.connect();

  try {
    const body = await request.json();
    const validation = DisableSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    // Buscar usuário
    const userResult = await client.query(
      'SELECT id, two_factor_secret, two_factor_enabled FROM users WHERE email = $1',
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    if (!user.two_factor_enabled) {
      return NextResponse.json(
        { error: '2FA não está ativado' },
        { status: 400 }
      );
    }

    // Verificar código TOTP antes de desativar (segurança)
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      return NextResponse.json(
        { error: 'Código inválido. Não foi possível desativar 2FA.' },
        { status: 400 }
      );
    }

    // Desativar 2FA e remover segredo
    await client.query(
      `UPDATE users 
       SET two_factor_enabled = false, 
           two_factor_secret = NULL,
           updated_at = NOW() 
       WHERE id = $1`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      message: '2FA desativado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao desativar 2FA:', error);
    return NextResponse.json(
      { error: 'Erro ao desativar autenticação de dois fatores' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
