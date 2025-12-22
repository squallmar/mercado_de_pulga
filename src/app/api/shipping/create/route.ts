import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/database';
import { z } from 'zod';

const CreateShipmentSchema = z.object({
  transaction_id: z.string().uuid(),
  method: z.enum(['carrier', 'local_pickup', 'local_meeting', 'own']),
  service_id: z.string().optional(),
  shipping_cost: z.number().min(0).default(0),
  from_address: z.object({
    postal_code: z.string(),
    street: z.string(),
    number: z.string(),
    complement: z.string().optional(),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string().length(2),
  }),
  to_address: z.object({
    postal_code: z.string(),
    street: z.string(),
    number: z.string(),
    complement: z.string().optional(),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string().length(2),
  }),
  meeting_details: z.object({
    date: z.string(),
    time: z.string(),
    location: z.string(),
    notes: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validation = CreateShipmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;
    const client = await pool.connect();

    try {
      // Verificar se a transação pertence ao vendedor
      const transactionResult = await client.query(
        `SELECT t.*, p.shipping_weight, p.shipping_height, p.shipping_width, p.shipping_length
         FROM transactions t
         JOIN products p ON t.product_id = p.id
         WHERE t.id = $1 AND t.seller_id = $2`,
        [data.transaction_id, token.id]
      );

      if (transactionResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Transação não encontrada ou você não tem permissão' },
          { status: 404 }
        );
      }

      const transaction = transactionResult.rows[0];

      // Criar registro de envio
      const shipmentResult = await client.query(
        `INSERT INTO shipments (
          transaction_id,
          method,
          shipping_cost,
          from_address,
          to_address,
          package_weight,
          package_height,
          package_width,
          package_length,
          meeting_details,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          data.transaction_id,
          data.method,
          data.shipping_cost,
          JSON.stringify(data.from_address),
          JSON.stringify(data.to_address),
          transaction.shipping_weight,
          transaction.shipping_height,
          transaction.shipping_width,
          transaction.shipping_length,
          data.meeting_details ? JSON.stringify(data.meeting_details) : null,
          'pending',
        ]
      );

      // Atualizar custo de envio na transação
      await client.query(
        'UPDATE transactions SET shipping_cost = $1 WHERE id = $2',
        [data.shipping_cost, data.transaction_id]
      );

      return NextResponse.json({
        shipment: shipmentResult.rows[0],
        message: 'Envio criado com sucesso',
      }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao criar envio:', error);
    return NextResponse.json(
      { error: 'Erro ao criar envio' },
      { status: 500 }
    );
  }
}
