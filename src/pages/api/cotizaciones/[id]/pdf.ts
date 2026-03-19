import type { APIRoute } from 'astro';

import { formatNumeroCotizacion } from '@/lib/cotizaciones/calculations';
import { getCotizacionById } from '@/lib/cotizaciones/repository';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { downloadPdfByPublicUrl } from '@/lib/supabase/storage';

export const GET: APIRoute = async ({ params, url }) => {
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
    const numero = formatNumeroCotizacion(cotizacion.numero);

    const body = new Uint8Array(bytes);

    return new Response(body, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'cache-control': 'public, max-age=3600',
        'content-disposition': forceDownload
          ? `attachment; filename="cotizacion-${numero}.pdf"`
          : `inline; filename="cotizacion-${numero}.pdf"`,
      },
    });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : 'No fue posible descargar el PDF.',
      { status: 500 },
    );
  }
};
