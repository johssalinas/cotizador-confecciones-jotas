import type { SupabaseClient } from '@supabase/supabase-js';

import { calcularTotal } from '@/lib/cotizaciones/calculations';
import {
  cotizacionInputSchema,
  productoSchema,
  type CotizacionInput,
  type CotizacionListItem,
  type CotizacionRecord,
} from '@/lib/cotizaciones/types';

const TABLE_NAME = 'cotizaciones';

interface DbCotizacionRow {
  id: string;
  numero: number;
  cliente: string;
  fecha: string;
  total: number | string;
  pdf_url: string;
  productos: unknown;
  created_at: string;
  updated_at: string;
}

function mapDbCotizacion(row: DbCotizacionRow): CotizacionRecord {
  const parsedProductos = productoSchema.array().safeParse(row.productos);

  return {
    id: row.id,
    numero: Number(row.numero),
    cliente: row.cliente,
    fecha: row.fecha,
    total: Number(row.total),
    pdfUrl: row.pdf_url,
    productos: parsedProductos.success ? parsedProductos.data : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCotizaciones(
  supabase: SupabaseClient,
  limit = 100,
): Promise<CotizacionListItem[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, numero, cliente, fecha, total, pdf_url')
    .order('numero', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`No fue posible listar cotizaciones: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    numero: Number(row.numero),
    cliente: row.cliente,
    fecha: row.fecha,
    total: Number(row.total),
    pdfUrl: row.pdf_url,
  }));
}

export async function getCotizacionById(
  supabase: SupabaseClient,
  id: string,
): Promise<CotizacionRecord | null> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .maybeSingle<DbCotizacionRow>();

  if (error) {
    throw new Error(`No fue posible consultar la cotizacion: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapDbCotizacion(data);
}

export async function createCotizacionDraft(
  supabase: SupabaseClient,
  input: CotizacionInput,
): Promise<CotizacionRecord> {
  const parsed = cotizacionInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('La cotizacion no cumple el formato esperado.');
  }

  const total = calcularTotal(parsed.data.productos);
  const payload = {
    cliente: parsed.data.cliente,
    fecha: parsed.data.fecha,
    total,
    productos: parsed.data.productos,
    pdf_url: '',
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select('*')
    .single<DbCotizacionRow>();

  if (error || !data) {
    throw new Error(`No fue posible crear la cotizacion: ${error?.message ?? 'sin datos'}`);
  }

  return mapDbCotizacion(data);
}

export async function updateCotizacionData(
  supabase: SupabaseClient,
  id: string,
  input: CotizacionInput,
): Promise<CotizacionRecord> {
  const parsed = cotizacionInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('La cotizacion no cumple el formato esperado.');
  }

  const total = calcularTotal(parsed.data.productos);
  const payload = {
    cliente: parsed.data.cliente,
    fecha: parsed.data.fecha,
    total,
    productos: parsed.data.productos,
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(payload)
    .eq('id', id)
    .select('*')
    .single<DbCotizacionRow>();

  if (error || !data) {
    throw new Error(`No fue posible actualizar la cotizacion: ${error?.message ?? 'sin datos'}`);
  }

  return mapDbCotizacion(data);
}

export async function setCotizacionPdfUrl(
  supabase: SupabaseClient,
  id: string,
  pdfUrl: string,
): Promise<CotizacionRecord> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ pdf_url: pdfUrl })
    .eq('id', id)
    .select('*')
    .single<DbCotizacionRow>();

  if (error || !data) {
    throw new Error(
      `No fue posible guardar el PDF de la cotizacion: ${error?.message ?? 'sin datos'}`,
    );
  }

  return mapDbCotizacion(data);
}

export async function deleteCotizacion(
  supabase: SupabaseClient,
  id: string,
): Promise<CotizacionRecord | null> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id)
    .select('*')
    .maybeSingle<DbCotizacionRow>();

  if (error) {
    throw new Error(`No fue posible eliminar la cotizacion: ${error.message}`);
  }

  return data ? mapDbCotizacion(data) : null;
}
