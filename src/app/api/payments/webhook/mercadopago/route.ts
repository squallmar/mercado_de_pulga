// Descontinuado: Integração de Mercado Pago removida em favor do Stripe.
// Este arquivo permanece apenas como referência histórica e será removido em breve.
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

interface MercadoPagoWebhook {
  id: number;
  live_mode: boolean;
  type: 'payment' | 'merchant_order';
  date_created: string;
  application_id: number;
  user_id: number;
  version: number;
  api_version: string;
  action: 'created' | 'updated';
  data: {
    id: string;
  };
}

// POST /api/payments/webhook/mercadopago
export async function POST(req: NextRequest) {
  try {
    const webhook: MercadoPagoWebhook = await req.json();
    
    // Verificar se é uma notificação de pagamento
    if (webhook.type !== 'payment') {
      return NextResponse.json({ message: 'Evento ignorado' });
    }

    const paymentId = webhook.data.id;
    
    // Buscar detalhes do pagamento no Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
    });

    if (!mpResponse.ok) {
      throw new Error('Erro ao buscar pagamento no Mercado Pago');
    }

    const paymentData = await mpResponse.json();
    const transactionId = paymentData.external_reference;

    const client = await pool.connect();
    try {
      // 1. Registrar evento do webhook
      await client.query(
        `INSERT INTO webhook_events (payment_id, event_type, provider, payload, processed)
         VALUES ($1, $2, $3, $4, $5)`,
        [paymentId, webhook.action, 'mercadopago', JSON.stringify(webhook), false]
      );

      // 2. Atualizar status da transação
      const newStatus = mapMercadoPagoStatus(paymentData.status);
      
      await client.query(
        'UPDATE transactions SET status = $1, updated_at = NOW() WHERE id = $2',
        [newStatus, transactionId]
      );

      // 3. Se aprovado, marcar produto como vendido
      if (newStatus === 'paid') {
        await client.query(
          `UPDATE products SET status = 'vendido' 
           WHERE id = (SELECT product_id FROM transactions WHERE id = $1)`,
          [transactionId]
        );

        // TODO: Enviar notificações para comprador e vendedor
        // TODO: Agendar liberação do pagamento para o vendedor (7-14 dias)
      }

      // 4. Marcar webhook como processado
      await client.query(
        'UPDATE webhook_events SET processed = true WHERE payment_id = $1 AND event_type = $2',
        [paymentId, webhook.action]
      );

      return NextResponse.json({ message: 'Webhook processado com sucesso' });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

function mapMercadoPagoStatus(mpStatus: string): string {
  switch (mpStatus) {
    case 'approved':
      return 'paid';
    case 'pending':
    case 'in_process':
      return 'processing';
    case 'rejected':
    case 'cancelled':
      return 'failed';
    case 'refunded':
    case 'charged_back':
      return 'refunded';
    default:
      return 'pending';
  }
}
