import type { APIRoute } from 'astro';

import {
  createCotizacionDraft,
  getCotizacionById,
  setCotizacionPdfUrl,
} from '@/lib/cotizaciones/repository';
import { jsonResponse } from '@/lib/http';
import { buildCotizacionPdf } from '@/lib/pdf/template';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { buildPdfStoragePath, uploadPdf } from '@/lib/supabase/storage';

export const POST: APIRoute = async ({ params }) => {
  const id = params.id;

  if (!id) {
    return jsonResponse({ error: 'Falta el id de cotizacion.' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const source = await getCotizacionById(supabase, id);

    if (!source) {
      return jsonResponse({ error: 'Cotizacion no encontrada.' }, { status: 404 });
    }

    const duplicate = await createCotizacionDraft(supabase, {
      cliente: source.cliente,
      fecha: source.fecha,
      productos: source.productos,
    });

    const pdfBytes = await buildCotizacionPdf({
      numero: duplicate.numero,
      cliente: duplicate.cliente,
      fecha: duplicate.fecha,
      productos: duplicate.productos,
    });

    const storagePath = buildPdfStoragePath(
      duplicate.numero,
      duplicate.id,
      duplicate.fecha,
    );
    const pdfUrl = await uploadPdf(supabase, storagePath, pdfBytes);

    const saved = await setCotizacionPdfUrl(supabase, duplicate.id, pdfUrl);

    return jsonResponse({ data: saved }, { status: 201 });
  } catch (error) {
    return jsonResponse(
      {
        error: 'No fue posible duplicar la cotizacion.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
};
