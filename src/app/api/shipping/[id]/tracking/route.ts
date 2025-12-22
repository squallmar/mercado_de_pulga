import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/database';
import { trackShipment } from '@/lib/melhorenvio';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const client = await pool.connect();

    try {
      // Buscar envio (comprador ou vendedor pode visualizar)
      const shipmentResult = await client.query(
        `SELECT s.*, t.seller_id, t.buyer_id
         FROM shipments s
         JOIN transactions t ON s.transaction_id = t.id
         WHERE s.id = $1 AND (t.seller_id = $2 OR t.buyer_id = $2)`,
        [id, token.id]
      );

      if (shipmentResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Envio não encontrado' },
          { status: 404 }
        );
      }

      const shipment = shipmentResult.rows[0];

      // Se não tiver tracking code, retornar apenas status local
      if (!shipment.melhor_envio_order_id) {
        const events =
          typeof shipment.tracking_events === 'string'
            ? JSON.parse(shipment.tracking_events)
            : shipment.tracking_events || [];

        return NextResponse.json({
          tracking_code: shipment.tracking_code || 'N/A',
          status: shipment.status,
          method: shipment.method,
          events,
        });
      }

      // Buscar rastreamento no Melhor Envio
      try {
        const tracking = await trackShipment(shipment.melhor_envio_order_id);

        const formattedEvents = tracking.occurrences.map(
          (occ: { date: string; description: string; location?: string }) => ({
            date: occ.date,
            description: occ.description,
            location: occ.location || '',
          })
        );

        await client.query(
          `UPDATE shipments
           SET tracking_events = $1,
               status = $2,
               updated_at = NOW()
           WHERE id = $3`,
          [
            JSON.stringify(formattedEvents),
            tracking.status || shipment.status,
            id,
          ]
        );

        return NextResponse.json({
          tracking_code: shipment.tracking_code,
          status: tracking.status || shipment.status,
          method: shipment.method,
          events: formattedEvents,
        });
      } catch (trackError) {
        console.error('Erro ao rastrear no Melhor Envio:', trackError);

        const events =
          typeof shipment.tracking_events === 'string'
            ? JSON.parse(shipment.tracking_events)
            : shipment.tracking_events || [];

        return NextResponse.json({
          tracking_code: shipment.tracking_code,
          status: shipment.status,
          method: shipment.method,
          events,
        });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao buscar rastreamento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar rastreamento' },
      { status: 500 }
    );
  }
}
