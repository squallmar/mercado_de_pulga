import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import pool from '@/lib/database';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export async function POST() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const client = await pool.connect();

  try {
    // Gerar segredo TOTP
    const secret = speakeasy.generateSecret({
      name: `Mercado de Pulgas (${session.user.email})`,
      issuer: 'Mercado de Pulgas',
    });

    // Buscar usuário
    const userResult = await client.query(
      'SELECT id, two_factor_enabled FROM users WHERE email = $1',
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Salvar o segredo temporariamente (ainda não ativado)
    await client.query(
      `UPDATE users 
       SET two_factor_secret = $1, updated_at = NOW() 
       WHERE id = $2`,
      [secret.base32, user.id]
    );

    // Gerar QR Code
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return NextResponse.json({
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      otpauthUrl: secret.otpauth_url,
    });
  } catch (error) {
    console.error('Erro ao configurar 2FA:', error);
    return NextResponse.json(
      { error: 'Erro ao configurar autenticação de dois fatores' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
