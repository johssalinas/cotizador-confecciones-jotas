import type { APIRoute } from 'astro';
import { z } from 'zod';

import {
  createCotizacionDraft,
  deleteCotizacion,
  listCotizaciones,
} from '@/lib/cotizaciones/repository';
import { cotizacionInputSchema } from '@/lib/cotizaciones/types';
import { jsonResponse, parseJsonRequest } from '@/lib/http';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const GET: APIRoute = async ({ url }) => {
  try {
    const limit = Number(url.searchParams.get('limit') ?? '100');
    const safeLimit = Number.isNaN(limit) ? 100 : Math.min(Math.max(limit, 1), 200);

    const supabase = getSupabaseServerClient();
    const cotizaciones = await listCotizaciones(supabase, safeLimit);

    return jsonResponse({ data: cotizaciones }, { status: 200 });
  } catch (error) {
    return jsonResponse(
      {
        error: 'No fue posible listar las cotizaciones.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  const body = await parseJsonRequest<unknown>(request);
  const parsed = cotizacionInputSchema.safeParse(body);

  if (!parsed.success) {
    return jsonResponse(
      {
        error: 'Datos invalidos para crear la cotizacion.',
        details: z.flattenError(parsed.error),
      },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();
  let draftId: string | null = null;

  try {
    const draft = await createCotizacionDraft(supabase, parsed.data);
    draftId = draft.id;

    return jsonResponse({ data: draft }, { status: 201 });
  } catch (error) {
    if (draftId) {
      await deleteCotizacion(supabase, draftId).catch(() => undefined);
    }

    return jsonResponse(
      {
        error: 'No fue posible crear la cotizacion.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
};
