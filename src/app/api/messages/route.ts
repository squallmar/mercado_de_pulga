import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { getToken } from 'next-auth/jwt';

// GET /api/messages?conversation_id=... -> lista mensagens de uma conversa
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversation_id = searchParams.get('conversation_id');
    if (!conversation_id) {
      return NextResponse.json({ error: 'conversation_id é obrigatório' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // Verify user is part of this conversation
      const convResult = await client.query(
        'SELECT * FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
        [conversation_id, token.id]
      );
      
      if (convResult.rows.length === 0) {
        return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
      }

      const result = await client.query(
        `SELECT m.*, u.name as sender_name
         FROM messages m
         JOIN users u ON u.id = m.sender_id
         WHERE m.conversation_id = $1
         ORDER BY m.created_at ASC`,
        [conversation_id]
      );

      return NextResponse.json({ messages: result.rows });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('GET /api/messages error', err);
    return NextResponse.json({ error: 'Erro ao buscar mensagens' }, { status: 500 });
  }
}

// POST /api/messages -> enviar nova mensagem { conversation_id, content }
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { conversation_id, content } = body as { conversation_id?: string; content?: string };
    
    if (!conversation_id || !content?.trim()) {
      return NextResponse.json({ error: 'conversation_id e content são obrigatórios' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // Verify user is part of this conversation
      const convResult = await client.query(
        'SELECT * FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
        [conversation_id, token.id]
      );
      
      if (convResult.rows.length === 0) {
        return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
      }

      // Insert message
      const result = await client.query(
        `INSERT INTO messages (conversation_id, sender_id, content) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [conversation_id, token.id, content.trim()]
      );

      // Update conversation timestamp
      await client.query(
        'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
        [conversation_id]
      );

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('POST /api/messages error', err);
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 });
  }
}