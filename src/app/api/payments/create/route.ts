import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/database';
import Stripe from 'stripe';
import { z } from 'zod';

const stripeSecret = process.env.STRIPE_SECRET_KEY as string;
const PLATFORM_FEE_PERCENTAGE = 0.08; // 8%

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2025-09-30.clover',
});

// POST /api/payments/create -> cria uma Stripe Checkout Session e retorna a URL
const CreatePaymentSchema = z.object({
  product_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const parsed = CreatePaymentSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });
    const { product_id } = parsed.data;

    const client = await pool.connect();
    try {
      const productRes = await client.query('SELECT * FROM products WHERE id = $1 AND status = $2', [product_id, 'disponivel']);
      if (productRes.rows.length === 0) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
      const product = productRes.rows[0];

      if (product.seller_id === token.id) return NextResponse.json({ error: 'Não é possível comprar seu próprio produto' }, { status: 400 });

      const amount = Math.round(Number(product.price) * 100); // centavos BRL
      const platform_fee = Math.round(amount * PLATFORM_FEE_PERCENTAGE);
      const seller_amount = amount - platform_fee;

      // Cria transação local (em reais, mas guardamos os centavos em Stripe)
      const trxRes = await client.query(
        `INSERT INTO transactions (product_id, buyer_id, seller_id, amount, platform_fee, seller_amount, payment_method, payment_provider, status)
         VALUES ($1, $2, $3, $4/100.0, $5/100.0, $6/100.0, $7, $8, $9) RETURNING *`,
        [product_id, token.id, product.seller_id, amount, platform_fee, seller_amount, 'pix', 'stripe', 'pending']
      );
      const transaction = trxRes.rows[0];

      // Stripe Checkout Session (suporta Pix no Brasil via payment_method_types)
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card', 'pix'],
        metadata: {
          transaction_id: transaction.id,
          product_id,
          buyer_id: token.id as string,
          seller_id: product.seller_id as string,
        },
        line_items: [
          {
            price_data: {
              currency: 'brl',
              product_data: { name: product.title },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXTAUTH_URL}/payments/{CHECKOUT_SESSION_ID}?status=success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/products/${product_id}?status=cancelled`,
        // Para split com Stripe Connect (futuro): transfer_data + application_fee_amount
        // payment_intent_data: {
        //   application_fee_amount: platform_fee,
        //   transfer_data: { destination: '{{CONNECTED_ACCOUNT_ID}}' },
        // },
      });

      await client.query('UPDATE transactions SET provider_transaction_id = $1 WHERE id = $2', [session.id, transaction.id]);

      return NextResponse.json({ checkout_url: session.url, transaction_id: transaction.id });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Stripe create checkout error:', err);
    return NextResponse.json({ error: 'Erro ao iniciar checkout' }, { status: 500 });
  }
}