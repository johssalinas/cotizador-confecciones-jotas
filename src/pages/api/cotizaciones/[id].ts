import type { APIRoute } from 'astro';
import { z } from 'zod';

import {
  deleteCotizacion,
  getCotizacionById,
  setCotizacionPdfUrl,
  updateCotizacionData,
} from '@/lib/cotizaciones/repository';
import { cotizacionInputSchema } from '@/lib/cotizaciones/types';
import { jsonResponse, parseJsonRequest } from '@/lib/http';
import { buildCotizacionPdf } from '@/lib/pdf/template';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  buildPdfStoragePath,
  removePdfByPublicUrl,
  uploadPdf,
} from '@/lib/supabase/storage';

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;

  if (!id) {
    return jsonResponse({ error: 'Falta el id de cotizacion.' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const cotizacion = await getCotizacionById(supabase, id);

    if (!cotizacion) {
      return jsonResponse({ error: 'Cotizacion no encontrada.' }, { status: 404 });
    }

    return jsonResponse({ data: cotizacion }, { status: 200 });
  } catch (error) {
    return jsonResponse(
      {
        error: 'No fue posible consultar la cotizacion.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;

  if (!id) {
    return jsonResponse({ error: 'Falta el id de cotizacion.' }, { status: 400 });
  }

  const body = await parseJsonRequest<unknown>(request);
  const parsed = cotizacionInputSchema.safeParse(body);

  if (!parsed.success) {
    return jsonResponse(
      {
        error: 'Datos invalidos para actualizar la cotizacion.',
        details: z.flattenError(parsed.error),
      },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseServerClient();
    const previous = await getCotizacionById(supabase, id);

    if (!previous) {
      return jsonResponse({ error: 'Cotizacion no encontrada.' }, { status: 404 });
    }

    const updated = await updateCotizacionData(supabase, id, parsed.data);

    const pdfBytes = await buildCotizacionPdf({
      numero: updated.numero,
      cliente: parsed.data.cliente,
      fecha: parsed.data.fecha,
      observaciones: parsed.data.observaciones,
      productos: parsed.data.productos,
    });

    const storagePath = buildPdfStoragePath(updated.numero, updated.id, updated.fecha);
    const pdfUrl = await uploadPdf(supabase, storagePath, pdfBytes);

    const saved = await setCotizacionPdfUrl(supabase, updated.id, pdfUrl);

    if (previous.pdfUrl && previous.pdfUrl !== saved.pdfUrl) {
      await removePdfByPublicUrl(supabase, previous.pdfUrl).catch(() => undefined);
    }

    return jsonResponse({ data: saved }, { status: 200 });
  } catch (error) {
    return jsonResponse(
      {
        error: 'No fue posible actualizar la cotizacion.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;

  if (!id) {
    return jsonResponse({ error: 'Falta el id de cotizacion.' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const existing = await getCotizacionById(supabase, id);

    if (!existing) {
      return jsonResponse({ error: 'Cotizacion no encontrada.' }, { status: 404 });
    }

    await deleteCotizacion(supabase, id);

    if (existing.pdfUrl) {
      await removePdfByPublicUrl(supabase, existing.pdfUrl).catch(() => undefined);
    }

    return jsonResponse({ ok: true }, { status: 200 });
  } catch (error) {
    return jsonResponse(
      {
        error: 'No fue posible eliminar la cotizacion.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
};
