import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

const RegisterSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().max(255),
  password: z.string().min(6).max(255),
  phone: z.string().max(20).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });
    }
    const { name, email, password, phone, location } = parsed.data;

    // Validações básicas
    // Regra já coberta pelo Zod (mínimo e formato)

    // Verificar se o email já existe
    const client = await pool.connect();
    
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      client.release();
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Gerar token de verificação
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 horas

    // Criar usuário
    const result = await client.query(`
      INSERT INTO users (name, email, password, phone, location, email_verification_token, email_verification_expires)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, phone, location, verified, created_at
    `, [name, email, hashedPassword, phone || null, location || null, verificationToken, verificationExpires]);

    client.release();

    const user = result.rows[0];

    // Enviar e-mail de verificação
    try {
      await sendVerificationEmail(email, verificationToken, name);
    } catch (emailError) {
      console.error('Erro ao enviar e-mail de verificação:', emailError);
      // Não falhar o registro se o e-mail falhar
    }

    return NextResponse.json({
      message: 'Usuário cadastrado com sucesso! Verifique seu e-mail para ativar sua conta.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        verified: user.verified,
        created_at: user.created_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}