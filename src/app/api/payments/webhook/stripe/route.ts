import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import pool from '@/lib/database';

export const runtime = 'nodejs'; // obrigatório para webhook Stripe

export async function POST(req: NextRequest) {
  // ✅ As envs só são lidas aqui dentro
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Stripe env vars ausentes');
    return NextResponse.json(
      { error: 'Stripe não configurado' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
  });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed.', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    // Idempotência
    const evtId = event.id;
    const exists = await client.query(
      `SELECT 1 FROM webhook_events 
       WHERE payment_id = $1 AND provider = $2 AND event_type = $3 AND processed = true`,
      [evtId, 'stripe', event.type]
    );

    if (exists.rows.length > 0) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    await client.query(
      `INSERT INTO webhook_events (payment_id, event_type, provider, payload, processed)
       VALUES ($1, $2, $3, $4, false)
       ON CONFLICT DO NOTHING`,
      [evtId, event.type, 'stripe', JSON.stringify(event)]
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const transactionId = session.metadata?.transaction_id;

        if (transactionId) {
          await client.query(
            `UPDATE transactions SET status = 'paid', updated_at = NOW() WHERE id = $1`,
            [transactionId]
          );

          await client.query(
            `UPDATE products 
             SET status = 'vendido'
             WHERE id = (SELECT product_id FROM transactions WHERE id = $1)`,
            [transactionId]
          );
        }
        break;
      }
    }

    await client.query(
      `UPDATE webhook_events 
       SET processed = true 
       WHERE payment_id = $1 AND provider = $2 AND event_type = $3`,
      [evtId, 'stripe', event.type]
    );

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook processing error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  } finally {
    client.release();
  }
}
