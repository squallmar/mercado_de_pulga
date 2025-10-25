import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import pool from '@/lib/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2025-09-30.clover' });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed.', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    const client = await pool.connect();
    try {
      // Idempotência: ignore se evento já processado
      const evtId = event.id;
      const exists = await client.query(
        `SELECT id FROM webhook_events WHERE payment_id = $1 AND provider = $2 AND event_type = $3 AND processed = true`,
        [evtId, 'stripe', event.type]
      );
      if (exists.rows.length > 0) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      // Registrar evento como não processado ainda
      await client.query(
        `INSERT INTO webhook_events (payment_id, event_type, provider, payload, processed) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [evtId, event.type, 'stripe', JSON.stringify(event), false]
      );

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const transactionId = session.metadata?.transaction_id;
          if (transactionId) {
            await client.query('UPDATE transactions SET status = $1, updated_at = NOW() WHERE id = $2', ['paid', transactionId]);
            // Optional: marcar produto como vendido
            await client.query(
              `UPDATE products SET status = 'vendido' WHERE id = (SELECT product_id FROM transactions WHERE id = $1)`,
              [transactionId]
            );
          }
          break;
        }
        case 'payment_intent.succeeded':
          // pode ser usado se não utilizar checkout.session
          break;
        default:
          // ignore outros eventos por enquanto
          break;
      }
      // Marcar evento como processado
      await client.query('UPDATE webhook_events SET processed = true WHERE payment_id = $1 AND provider = $2 AND event_type = $3', [event.id, 'stripe', event.type]);
    } finally {
      client.release();
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook processing error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
