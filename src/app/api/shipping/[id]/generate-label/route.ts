import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/database';
import { addToCart, checkout, generateLabel, printLabel } from '@/lib/melhorenvio';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const client = await pool.connect();

    try {
      // Buscar envio e verificar se pertence ao vendedor
      const shipmentResult = await client.query(
        `SELECT s.*, t.seller_id, t.buyer_id, p.title as product_title, p.price,
         u_seller.name as seller_name, u_seller.email as seller_email, u_seller.phone as seller_phone,
         u_buyer.name as buyer_name, u_buyer.email as buyer_email, u_buyer.phone as buyer_phone
         FROM shipments s
         JOIN transactions t ON s.transaction_id = t.id
         JOIN products p ON t.product_id = p.id
         JOIN users u_seller ON t.seller_id = u_seller.id
         JOIN users u_buyer ON t.buyer_id = u_buyer.id
         WHERE s.id = $1 AND t.seller_id = $2`,
        [id, token.id]
      );

      if (shipmentResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Envio não encontrado ou você não tem permissão' },
          { status: 404 }
        );
      }

      const shipment = shipmentResult.rows[0];

      if (shipment.method !== 'carrier') {
        return NextResponse.json(
          { error: 'Etiqueta só pode ser gerada para envios por transportadora' },
          { status: 400 }
        );
      }

      if (shipment.label_url) {
        return NextResponse.json(
          { error: 'Etiqueta já foi gerada para este envio' },
          { status: 400 }
        );
      }

      // Preparar dados para Melhor Envio
      const fromAddress = typeof shipment.from_address === 'string' 
        ? JSON.parse(shipment.from_address) 
        : shipment.from_address;
      
      const toAddress = typeof shipment.to_address === 'string'
        ? JSON.parse(shipment.to_address)
        : shipment.to_address;

      // Adicionar ao carrinho do Melhor Envio
      const cartItem = {
        service: parseInt(shipment.service_name || '1'), // ID do serviço (PAC, SEDEX, etc.)
        from: {
          name: shipment.seller_name,
          phone: shipment.seller_phone || '11999999999',
          email: shipment.seller_email,
          document: '00000000000',
          address: fromAddress.street,
          complement: fromAddress.complement || '',
          number: fromAddress.number,
          district: fromAddress.neighborhood,
          city: fromAddress.city,
          state_abbr: fromAddress.state,
          country_id: 'BR',
          postal_code: fromAddress.postal_code.replace(/\D/g, ''),
        },
        to: {
          name: shipment.buyer_name,
          phone: shipment.buyer_phone || '11999999999',
          email: shipment.buyer_email,
          document: '00000000000',
          address: toAddress.street,
          complement: toAddress.complement || '',
          number: toAddress.number,
          district: toAddress.neighborhood,
          city: toAddress.city,
          state_abbr: toAddress.state,
          country_id: 'BR',
          postal_code: toAddress.postal_code.replace(/\D/g, ''),
        },
        package: {
          weight: parseFloat(shipment.package_weight),
          width: shipment.package_width,
          height: shipment.package_height,
          length: shipment.package_length,
          insurance_value: parseFloat(shipment.price),
        },
        products: [
          {
            name: shipment.product_title,
            quantity: 1,
            unitary_value: parseFloat(shipment.price),
          },
        ],
      };

      // Adicionar ao carrinho
      const cart = await addToCart(cartItem);

      // Fazer checkout
      const purchase = await checkout([cart.id]);

      // Gerar etiqueta
      await generateLabel([purchase.purchase.id]);

      // Imprimir (obter URL do PDF)
      const label = await printLabel([purchase.purchase.id]);

      // Atualizar shipment com tracking code e label URL
      await client.query(
        `UPDATE shipments 
         SET melhor_envio_order_id = $1, 
             tracking_code = $2,
             label_url = $3,
             status = 'label_generated',
             updated_at = NOW()
         WHERE id = $4`,
        [purchase.purchase.id, purchase.purchase.protocol, label.url, id]
      );

      return NextResponse.json({
        label_url: label.url,
        tracking_code: purchase.purchase.protocol,
        message: 'Etiqueta gerada com sucesso',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao gerar etiqueta:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar etiqueta' },
      { status: 500 }
    );
  }
}
