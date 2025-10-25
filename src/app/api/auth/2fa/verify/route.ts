import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import pool from '@/lib/database';
import speakeasy from 'speakeasy';
import { z } from 'zod';
import { send2FASetupEmail } from '@/lib/email';

const VerifySchema = z.object({
  token: z.string().length(6, 'Código deve ter 6 dígitos'),
  enable: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const client = await pool.connect();

  try {
    const body = await request.json();
    const validation = VerifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { token, enable } = validation.data;

    // Buscar usuário e segredo
    const userResult = await client.query(
      'SELECT id, name, two_factor_secret, two_factor_enabled FROM users WHERE email = $1',
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    if (!user.two_factor_secret) {
      return NextResponse.json(
        { error: '2FA não configurado. Execute /api/auth/2fa/setup primeiro.' },
        { status: 400 }
      );
    }

    // Verificar código TOTP
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token,
      window: 2, // Aceita códigos de até 2 períodos antes/depois (60s cada)
    });

    if (!verified) {
      return NextResponse.json(
        { error: 'Código inválido ou expirado' },
        { status: 400 }
      );
    }

    // Se enable=true, ativar 2FA definitivamente
    if (enable && !user.two_factor_enabled) {
      await client.query(
        `UPDATE users 
         SET two_factor_enabled = true, updated_at = NOW() 
         WHERE id = $1`,
        [user.id]
      );

      // Enviar e-mail de confirmação
      try {
        await send2FASetupEmail(session.user.email, user.name);
      } catch (emailError) {
        console.error('Erro ao enviar e-mail de 2FA:', emailError);
        // Não falhar a requisição por erro de e-mail
      }

      return NextResponse.json({
        success: true,
        message: '2FA ativado com sucesso',
        enabled: true,
      });
    }

    // Caso contrário, apenas validar o código
    return NextResponse.json({
      success: true,
      message: 'Código válido',
      enabled: user.two_factor_enabled,
    });
  } catch (error) {
    console.error('Erro ao verificar 2FA:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar código de autenticação' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
