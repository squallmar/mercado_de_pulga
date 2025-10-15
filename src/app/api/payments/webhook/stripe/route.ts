import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import pool from '@/lib/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-06-20' });
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
    } finally {
      client.release();
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook processing error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
