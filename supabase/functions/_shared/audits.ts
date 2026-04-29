// filepath: /workspaces/Lexium-backend/supabase/functions/_shared/audits.ts
import { SupabaseClient } from '@supabase/supabase-js'

export type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';

export interface AuditLog {
  id?: string;
  request_id: string;
  action: AuditAction | 'ERROR';
  table_name?: string;
  record_id?: string;
  user_id?: string;
  ip_address: string;
  user_agent: string;
  referer?: string;
  timestamp: string;
  details?: Record<string, unknown>;
  error?: string;
}

export interface RequestContext {
  ip_address: string;
  user_agent: string;
  referer?: string;
}

export function generateRequestId(): string {
  return crypto.randomUUID();
}

export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

export function extractContext(req: Request): RequestContext {
  const ip_address =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const user_agent = req.headers.get('user-agent') || 'unknown';
  const referer = req.headers.get('referer') || undefined;

  return {
    ip_address,
    user_agent,
    ...(referer && { referer }),
  };
}

export async function logAudit(
  supabase: SupabaseClient,
  action: AuditAction,
  table_name: string,
  record_id?: string,
  user_id?: string,
  details?: Record<string, unknown>,
  request_id?: string,
  req?: Request
): Promise<void> {
  const id = request_id || generateRequestId();
  const ctx: RequestContext = req ? extractContext(req) : { ip_address: 'unknown', user_agent: 'unknown' };
  const timestamp = formatTimestamp();

  const logEntry: Omit<AuditLog, 'id'> = {
    request_id: id,
    action,
    table_name,
    record_id,
    user_id,
    ip_address: ctx.ip_address,
    user_agent: ctx.user_agent,
    referer: ctx.referer,
    timestamp,
    details,
  };

  const { error } = await supabase.from('audit_logs').insert(logEntry);
  if (error) {
    throw new Error(`Falha ao inserir log de auditoria: ${error.message}`);
  }
}

export async function logError(
  supabase: SupabaseClient,
  error: unknown,
  request_id?: string,
  table_name?: string,
  record_id?: string,
  user_id?: string,
  details?: Record<string, unknown>,
  req?: Request
): Promise<void> {
  const id = request_id || generateRequestId();
  const ctx: RequestContext = req ? extractContext(req) : { ip_address: 'unknown', user_agent: 'unknown' };
  const timestamp = formatTimestamp();

  const errorMessage = error instanceof Error ? (error.stack || error.message) : JSON.stringify(error);

  const logEntry: Omit<AuditLog, 'id'> = {
    request_id: id,
    action: 'ERROR',
    table_name,
    record_id,
    user_id,
    ip_address: ctx.ip_address,
    user_agent: ctx.user_agent,
    referer: ctx.referer,
    timestamp,
    details,
    error: errorMessage,
  };

  const { error: insertError } = await supabase.from('audit_logs').insert(logEntry);
  if (insertError) {
    throw new Error(`Falha ao inserir log de erro: ${insertError.message}`);
  }
}
