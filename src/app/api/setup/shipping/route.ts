import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const client = await pool.connect();

    try {
      console.log('Iniciando migração de shipping...');

      // Adicionar colunas de dimensões de envio na tabela products
      await client.query(`
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS shipping_weight DECIMAL(10, 3),
        ADD COLUMN IF NOT EXISTS shipping_height INTEGER,
        ADD COLUMN IF NOT EXISTS shipping_width INTEGER,
        ADD COLUMN IF NOT EXISTS shipping_length INTEGER,
        ADD COLUMN IF NOT EXISTS local_pickup BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false
      `);

      // Adicionar colunas de endereço na tabela users
      await client.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS address_street VARCHAR(255),
        ADD COLUMN IF NOT EXISTS address_number VARCHAR(20),
        ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100),
        ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100),
        ADD COLUMN IF NOT EXISTS address_city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS address_state VARCHAR(2),
        ADD COLUMN IF NOT EXISTS address_postal_code VARCHAR(9)
      `);

      // Criar tabela de envios
      await client.query(`
        CREATE TABLE IF NOT EXISTS shipments (
          id SERIAL PRIMARY KEY,
          transaction_id INTEGER NOT NULL,
          method VARCHAR(50) NOT NULL,
          carrier_name VARCHAR(100),
          service_name VARCHAR(100),
          tracking_code VARCHAR(100),
          melhor_envio_order_id VARCHAR(100),
          label_url TEXT,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          from_address JSONB NOT NULL,
          to_address JSONB NOT NULL,
          package_weight DECIMAL(10, 3),
          package_height INTEGER,
          package_width INTEGER,
          package_length INTEGER,
          tracking_events JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Criar índices
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_shipments_transaction ON shipments(transaction_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_code)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_shipments_melhor_envio ON shipments(melhor_envio_order_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status)
      `);

      console.log('Migração concluída com sucesso!');

      return NextResponse.json({
        message: 'Migração de shipping executada com sucesso',
        changes: {
          products: 'Adicionadas colunas: shipping_weight, shipping_height, shipping_width, shipping_length, local_pickup, free_shipping',
          users: 'Adicionadas colunas de endereço: address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_postal_code',
          shipments: 'Tabela criada com índices',
        }
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro na migração:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao executar migração',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
