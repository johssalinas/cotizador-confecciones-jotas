import type { SupabaseClient } from '@supabase/supabase-js';

const AUDIT_TABLE = 'cotizaciones_auditoria';

export type CotizacionAuditAction = 'view' | 'download';

export interface CotizacionAuditInput {
  cotizacionId: string;
  action: CotizacionAuditAction;
  usuario: string;
  ip: string | null;
  userAgent: string | null;
}

export function resolveAuditActor(request: Request): {
  usuario: string;
  ip: string | null;
  userAgent: string | null;
} {
  const explicitUser = request.headers.get('x-user-id') ?? request.headers.get('x-user-email');
  const userAgent = request.headers.get('user-agent');
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || null;

  return {
    usuario: explicitUser?.trim() || 'anonimo',
    ip,
    userAgent,
  };
}

export async function logCotizacionAudit(
  supabase: SupabaseClient,
  input: CotizacionAuditInput,
): Promise<void> {
  const { error } = await supabase.from(AUDIT_TABLE).insert({
    cotizacion_id: input.cotizacionId,
    accion: input.action,
    usuario: input.usuario,
    ip: input.ip,
    user_agent: input.userAgent,
  });

  if (error) {
    throw new Error(`No fue posible registrar auditoría (${input.action}): ${error.message}`);
  }
}
