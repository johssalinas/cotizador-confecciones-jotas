import type { APIRoute } from 'astro';

import { logCotizacionAudit, resolveAuditActor } from '@/lib/cotizaciones/audit';
import { getCotizacionById } from '@/lib/cotizaciones/repository';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { buildPdfDownloadName, downloadPdfByPublicUrl } from '@/lib/supabase/storage';

export const GET: APIRoute = async ({ params, request, url }) => {
  const id = params.id;

  if (!id) {
    return new Response('Falta el id de cotizacion.', { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const cotizacion = await getCotizacionById(supabase, id);

    if (!cotizacion || !cotizacion.pdfUrl) {
      return new Response('Cotización no encontrada.', { status: 404 });
    }

    const bytes = await downloadPdfByPublicUrl(supabase, cotizacion.pdfUrl);
    const forceDownload = url.searchParams.get('download') === '1';
    const fileName = buildPdfDownloadName(cotizacion.cliente, cotizacion.numero);
    const actor = resolveAuditActor(request);

    const body = new Uint8Array(bytes);

    await logCotizacionAudit(supabase, {
      cotizacionId: cotizacion.id,
      action: forceDownload ? 'download' : 'view',
      usuario: actor.usuario,
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return new Response(body, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'cache-control': 'public, max-age=3600',
        'content-disposition': forceDownload
          ? `attachment; filename="${fileName}"`
          : `inline; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return new Response(
      error instanceof Error
        ? `No fue posible recuperar el PDF almacenado: ${error.message}`
        : 'No fue posible recuperar el PDF almacenado.',
      { status: 500 },
    );
  }
};
