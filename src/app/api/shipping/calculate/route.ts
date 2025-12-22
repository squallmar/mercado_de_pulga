import { NextRequest, NextResponse } from 'next/server';
import { calculateShipping, isValidCep } from '@/lib/melhorenvio';
import pool from '@/lib/database';
import { z } from 'zod';

const CalculateShippingSchema = z.object({
  product_id: z.string(),
  to_postal_code: z.string().regex(/^\d{5}-?\d{3}$/),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = CalculateShippingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { product_id, to_postal_code } = validation.data;

    // Validar CEP
    if (!isValidCep(to_postal_code)) {
      return NextResponse.json(
        { error: 'CEP inválido' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Buscar produto com dimensões
      const productResult = await client.query(
        `SELECT p.*, u.address_postal_code as seller_cep, u.location
         FROM products p
         JOIN users u ON p.seller_id = u.id
         WHERE p.id = $1`,
        [product_id]
      );

      if (productResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Produto não encontrado' },
          { status: 404 }
        );
      }

      const product = productResult.rows[0];

      // Verificar se produto tem dimensões configuradas
      if (!product.shipping_weight || !product.shipping_height || !product.shipping_width || !product.shipping_length) {
        // Retornar apenas opções locais se não tiver dimensões
        const localOptions: Array<{
          id: string;
          name: string;
          price: number;
          delivery_time: number;
          method?: string;
          description?: string;
        }> = [];

        // Opção: Retirada Local
        localOptions.push({
          id: 'local_pickup',
          name: 'Retirada no Local',
          price: 0,
          delivery_time: 0,
          method: 'local_pickup',
          description: `Retirar em ${product.location || 'local a combinar'}`,
        });

        // Opção: Encontro Presencial
        localOptions.push({
          id: 'local_meeting',
          name: 'Encontro Presencial',
          price: 0,
          delivery_time: 0,
          method: 'local_meeting',
          description: 'Combinar local e horário para entrega',
        });

        return NextResponse.json({ 
          options: localOptions,
          message: 'Apenas opções locais disponíveis (produto sem dimensões de envio)'
        });
      }

      const options: Array<{
        id: string;
        name: string;
        price: number;
        delivery_time: number;
        company?: {
          name: string;
          picture?: string;
        };
        method?: string;
        description?: string;
      }> = [];

      // Opção: Retirada Local (se habilitada)
      if (product.local_pickup) {
        options.push({
          id: 'local_pickup',
          name: 'Retirada no Local',
          price: 0,
          delivery_time: 0,
          method: 'local_pickup',
          description: `Retirar em ${product.location || 'local a combinar'}`,
        });
      }

      // Opção: Encontro Presencial
      options.push({
        id: 'local_meeting',
        name: 'Encontro Presencial',
        price: 0,
        delivery_time: 0,
        method: 'local_meeting',
        description: 'Combinar local e horário para entrega',
      });

      // Calcular frete via transportadoras (se vendedor tiver CEP)
      if (product.seller_cep && !product.free_shipping) {
        try {
          const quotes = await calculateShipping(
            { postal_code: product.seller_cep.replace(/\D/g, '') },
            { postal_code: to_postal_code.replace(/\D/g, '') },
            {
              weight: parseFloat(product.shipping_weight),
              height: product.shipping_height,
              width: product.shipping_width,
              length: product.shipping_length,
              insurance_value: parseFloat(product.price),
            }
          );

          // Adicionar opções de transportadoras
          for (const quote of quotes) {
            options.push({
              id: `carrier_${quote.id}`,
              name: quote.name,
              company: {
                name: quote.company.name,
                picture: quote.company.picture,
              },
              price: parseFloat(quote.price),
              delivery_time: quote.delivery_time,
              method: 'carrier',
              description: `${quote.company.name} - ${quote.delivery_time} dias úteis`,
            });
          }
        } catch (error) {
          console.error('Erro ao calcular frete:', error);
          // Continua sem opções de transportadora
        }
      }

      // Frete grátis
      if (product.free_shipping) {
        options.unshift({
          id: 'free_shipping',
          name: 'Frete Grátis',
          price: 0,
          delivery_time: 7,
          method: 'free_shipping',
          description: 'Frete pago pelo vendedor - 7 a 14 dias úteis',
        });
      }

      return NextResponse.json({ options });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao calcular frete:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao calcular frete';
    return NextResponse.json(
      { error: errorMessage, details: String(error) },
      { status: 500 }
    );
  }
}
