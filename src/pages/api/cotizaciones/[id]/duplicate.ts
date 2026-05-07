import type { APIRoute } from 'astro';

import {
  createCotizacionDraft,
  getCotizacionById,
  setCotizacionPdfUrl,
} from '@/lib/cotizaciones/repository';
import { jsonResponse } from '@/lib/http';
import { uploadValidatedCotizacionPdf } from '@/lib/pdf/workflow';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const POST: APIRoute = async ({ params }) => {
  const id = params.id;

  if (!id) {
    return jsonResponse({ error: 'Falta el id de cotizacion.' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const source = await getCotizacionById(supabase, id);

    if (!source) {
      return jsonResponse({ error: 'Cotización no encontrada.' }, { status: 404 });
    }

    const duplicate = await createCotizacionDraft(supabase, {
      cliente: source.cliente,
      fecha: source.fecha,
      productos: source.productos,
    });

    const pdfUrl = await uploadValidatedCotizacionPdf(supabase, {
      numero: duplicate.numero,
      cliente: duplicate.cliente,
      fecha: duplicate.fecha,
      productos: duplicate.productos,
    });

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
