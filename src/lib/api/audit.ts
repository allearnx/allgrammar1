import type { SupabaseClient } from '@supabase/supabase-js';

export async function auditLog(
  supabase: SupabaseClient,
  userId: string,
  action: string,
  target?: { type: string; id: string; details?: Record<string, unknown> }
) {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    target_type: target?.type ?? null,
    target_id: target?.id ?? null,
    details: target?.details ?? {},
  });
}
