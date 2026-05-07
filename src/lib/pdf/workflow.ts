import type { SupabaseClient } from '@supabase/supabase-js';

import type { ProductoInput } from '@/lib/cotizaciones/types';
import { buildCotizacionPdf } from '@/lib/pdf/template';
import { buildPdfStoragePath, uploadPdf } from '@/lib/supabase/storage';

const MIN_PDF_BYTES = 800;
const PDF_HEADER = '%PDF-';

export interface CotizacionPdfPayload {
  numero: number;
  cliente: string;
  fecha: string;
  productos: ProductoInput[];
}

export function assertValidPdfBuffer(pdfBytes: Uint8Array): void {
  if (pdfBytes.byteLength < MIN_PDF_BYTES) {
    throw new Error('El PDF generado es demasiado pequeño y parece inválido.');
  }

  const header = new TextDecoder('utf-8').decode(pdfBytes.slice(0, PDF_HEADER.length));
  if (header !== PDF_HEADER) {
    throw new Error('El archivo generado no corresponde a un PDF válido.');
  }
}

export async function buildValidatedCotizacionPdf(
  payload: CotizacionPdfPayload,
): Promise<Uint8Array> {
  const pdfBytes = await buildCotizacionPdf(payload);
  assertValidPdfBuffer(pdfBytes);
  return pdfBytes;
}

export async function uploadValidatedCotizacionPdf(
  supabase: SupabaseClient,
  payload: CotizacionPdfPayload,
): Promise<string> {
  const pdfBytes = await buildValidatedCotizacionPdf(payload);
  const storagePath = buildPdfStoragePath(payload.numero, payload.cliente, payload.fecha);
  return uploadPdf(supabase, storagePath, pdfBytes);
}
