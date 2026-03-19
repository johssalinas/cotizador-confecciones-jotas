import type { SupabaseClient } from '@supabase/supabase-js';

import { COTIZACIONES_BUCKET } from './server';

function formatNumeroForFile(value: number): string {
  const normalized = Math.max(0, Math.trunc(value));
  return normalized.toString().padStart(3, '0');
}

function sanitizeFileSegment(value: string): string {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized.length > 0 ? normalized : 'cliente';
}

export function buildPdfBaseName(cliente: string, numero: number): string {
  return `${sanitizeFileSegment(cliente)}-${formatNumeroForFile(numero)}`;
}

export function buildPdfDownloadName(cliente: string, numero: number): string {
  return `${buildPdfBaseName(cliente, numero)}.pdf`;
}

export function buildPdfStoragePath(numero: number, cliente: string, fecha: string): string {
  const date = new Date(fecha);
  const year = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  const month = Number.isNaN(date.getTime())
    ? `${new Date().getMonth() + 1}`.padStart(2, '0')
    : `${date.getMonth() + 1}`.padStart(2, '0');
  const fileName = buildPdfDownloadName(cliente, numero);

  return `${year}-${month}/${numero}/${fileName}`;
}

export async function uploadPdf(
  supabase: SupabaseClient,
  storagePath: string,
  pdfBytes: Uint8Array,
): Promise<string> {
  const { error } = await supabase.storage
    .from(COTIZACIONES_BUCKET)
    .upload(storagePath, pdfBytes, {
      cacheControl: '3600',
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    throw new Error(`No fue posible subir el PDF: ${error.message}`);
  }

  const { data } = supabase.storage.from(COTIZACIONES_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export function extractStoragePathFromPublicUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${COTIZACIONES_BUCKET}/`;
    const index = parsed.pathname.indexOf(marker);

    if (index === -1) {
      return null;
    }

    const encoded = parsed.pathname.slice(index + marker.length);
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

export async function removePdfByPublicUrl(
  supabase: SupabaseClient,
  publicUrl: string,
): Promise<void> {
  const storagePath = extractStoragePathFromPublicUrl(publicUrl);

  if (!storagePath) {
    return;
  }

  const { error } = await supabase.storage.from(COTIZACIONES_BUCKET).remove([storagePath]);

  if (error) {
    throw new Error(`No fue posible eliminar el PDF: ${error.message}`);
  }
}

export async function downloadPdfByPublicUrl(
  supabase: SupabaseClient,
  publicUrl: string,
): Promise<Uint8Array> {
  const storagePath = extractStoragePathFromPublicUrl(publicUrl);

  if (!storagePath) {
    throw new Error('La URL de PDF no pertenece al bucket configurado.');
  }

  const { data, error } = await supabase.storage
    .from(COTIZACIONES_BUCKET)
    .download(storagePath);

  if (error || !data) {
    throw new Error(`No fue posible descargar el PDF: ${error?.message ?? 'sin datos'}`);
  }

  return new Uint8Array(await data.arrayBuffer());
}
