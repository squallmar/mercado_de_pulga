import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { z } from 'zod';

const ProductCreateSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(10).max(10_000),
  price: z.number().positive().max(1_000_000),
  condition: z.enum(['novo', 'seminovo', 'usado', 'para_pecas']),
  category_id: z.string().uuid(),
  seller_id: z.string().uuid(),
  images: z.array(z.string().url()).max(10).optional(),
  location: z.string().max(255).optional().nullable(),
  tags: z.array(z.string().min(1).max(30)).max(20).optional(),
  shipping_weight: z.number().positive().nullable().optional(),
  shipping_height: z.number().int().positive().nullable().optional(),
  shipping_width: z.number().int().positive().nullable().optional(),
  shipping_length: z.number().int().positive().nullable().optional(),
  local_pickup: z.boolean().optional(),
  free_shipping: z.boolean().optional(),
});

const ProductUpdateSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().min(10).max(10_000).optional(),
  price: z.number().positive().max(1_000_000).optional(),
  location: z.string().max(255).optional().nullable(),
  images: z.array(z.string().url()).max(10).optional(),
  shipping_weight: z.number().positive().nullable().optional(),
  shipping_height: z.number().int().positive().nullable().optional(),
  shipping_width: z.number().int().positive().nullable().optional(),
  shipping_length: z.number().int().positive().nullable().optional(),
  local_pickup: z.boolean().optional(),
  free_shipping: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const condition = searchParams.get('condition');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    const sellerId = searchParams.get('seller_id'); // Novo parâmetro para filtrar por vendedor
    const id = searchParams.get('id'); // Para buscar produto específico
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    // Se foi solicitado um produto específico por ID
    if (id) {
      const client = await pool.connect();
      const result = await client.query(`
        SELECT p.*, u.name as seller_name, u.rating as seller_rating, c.name as category_name
        FROM products p
        JOIN users u ON p.seller_id = u.id
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = $1
      `, [id]);
      client.release();
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
      }
      
      const product = result.rows[0];
      // Parsear imagens se estiverem como string JSON
      if (typeof product.images === 'string') {
        try {
          product.images = JSON.parse(product.images);
        } catch {
          product.images = [];
        }
      }
      
      return NextResponse.json(product);
    }

    let query = `
      SELECT p.*, u.name as seller_name, u.rating as seller_rating, c.name as category_name
      FROM products p
      JOIN users u ON p.seller_id = u.id
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    
    const params: (string | number)[] = [];
    let paramCount = 0;

    // Se não há seller_id específico, mostrar apenas produtos disponíveis
    if (!sellerId) {
      query += ` AND p.status = 'disponivel'`;
    } else {
      // Se há seller_id, mostrar todos os produtos do vendedor
      paramCount++;
      query += ` AND p.seller_id = $${paramCount}`;
      params.push(sellerId);
    }

    if (category) {
      paramCount++;
      query += ` AND p.category_id = $${paramCount}`;
      params.push(category);
    }

    if (condition) {
      paramCount++;
      query += ` AND p.condition = $${paramCount}`;
      params.push(condition);
    }

    if (minPrice) {
      paramCount++;
      query += ` AND p.price >= $${paramCount}`;
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      paramCount++;
      query += ` AND p.price <= $${paramCount}`;
      params.push(parseFloat(maxPrice));
    }

    if (search) {
      paramCount++;
      query += ` AND (p.title ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const client = await pool.connect();
    const result = await client.query(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      WHERE 1=1
    `;
    const countParams: (string | number)[] = [];
    let countParamCount = 0;

    if (!sellerId) {
      countQuery += ` AND p.status = 'disponivel'`;
    } else {
      countParamCount++;
      countQuery += ` AND p.seller_id = $${countParamCount}`;
      countParams.push(sellerId);
    }

    if (category) {
      countParamCount++;
      countQuery += ` AND p.category_id = $${countParamCount}`;
      countParams.push(category);
    }

    if (condition) {
      countParamCount++;
      countQuery += ` AND p.condition = $${countParamCount}`;
      countParams.push(condition);
    }

    if (minPrice) {
      countParamCount++;
      countQuery += ` AND p.price >= $${countParamCount}`;
      countParams.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      countParamCount++;
      countQuery += ` AND p.price <= $${countParamCount}`;
      countParams.push(parseFloat(maxPrice));
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (p.title ILIKE $${countParamCount} OR p.description ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await client.query(countQuery, countParams);
    client.release();

    const products = result.rows.map(product => {
      // Parsear imagens se estiverem como string JSON
      if (typeof product.images === 'string') {
        try {
          product.images = JSON.parse(product.images);
        } catch {
          product.images = [];
        }
      }
      return product;
    });
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parse = ProductCreateSchema.safeParse({
      ...raw,
      price: typeof raw?.price === 'string' ? Number(raw.price) : raw?.price,
    });
    if (!parse.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parse.error.flatten() }, { status: 400 });
    }
    const { title, description, price, condition, category_id, seller_id, images, location, tags, shipping_weight, shipping_height, shipping_width, shipping_length, local_pickup, free_shipping } = parse.data;

    const client = await pool.connect();
    
    const query = `
      INSERT INTO products (
        title, description, price, condition, category_id, seller_id, images, location, tags, status,
        shipping_weight, shipping_height, shipping_width, shipping_length, local_pickup, free_shipping
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'disponivel', $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    
    const result = await client.query(query, [
      title,
      description,
      price,
      condition,
      category_id,
      seller_id,
      JSON.stringify(images || []),
      location,
      JSON.stringify(tags || []),
      shipping_weight,
      shipping_height,
      shipping_width,
      shipping_length,
      local_pickup || false,
      free_shipping || false,
    ]);
    
    client.release();

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 });
    }

    const raw = await request.json();
    const parsed = ProductUpdateSchema.safeParse({
      ...raw,
      price: typeof raw?.price === 'string' ? Number(raw.price) : raw?.price,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });
    }
    const { title, description, price, location, images, shipping_weight, shipping_height, shipping_width, shipping_length, local_pickup, free_shipping } = parsed.data as {
      title?: string;
      description?: string;
      price?: number;
      location?: string | null;
      images?: string[];
      shipping_weight?: number | null;
      shipping_height?: number | null;
      shipping_width?: number | null;
      shipping_length?: number | null;
      local_pickup?: boolean;
      free_shipping?: boolean;
    };

  const client = await pool.connect();
  const fields: string[] = [];
  const params: (string | number | boolean | null)[] = [];
    let idx = 1;

    if (title !== undefined) { fields.push(`title = $${idx++}`); params.push(title); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); params.push(description); }
    if (price !== undefined) { fields.push(`price = $${idx++}`); params.push(price); }
  if (location !== undefined) { fields.push(`location = $${idx++}`); params.push(location ?? ''); }
    if (images !== undefined) { fields.push(`images = $${idx++}`); params.push(JSON.stringify(images)); }
    if (shipping_weight !== undefined) { fields.push(`shipping_weight = $${idx++}`); params.push(shipping_weight); }
    if (shipping_height !== undefined) { fields.push(`shipping_height = $${idx++}`); params.push(shipping_height); }
    if (shipping_width !== undefined) { fields.push(`shipping_width = $${idx++}`); params.push(shipping_width); }
    if (shipping_length !== undefined) { fields.push(`shipping_length = $${idx++}`); params.push(shipping_length); }
    if (local_pickup !== undefined) { fields.push(`local_pickup = $${idx++}`); params.push(local_pickup); }
    if (free_shipping !== undefined) { fields.push(`free_shipping = $${idx++}`); params.push(free_shipping); }

    if (fields.length === 0) {
      client.release();
      return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });
    }

    const query = `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`;
    params.push(id);
    const result = await client.query(query, params);
    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}