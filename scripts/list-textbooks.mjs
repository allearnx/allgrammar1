import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { data: textbooks } = await sb
  .from('naesin_textbooks')
  .select('id, display_name, grade, publisher')
  .eq('grade', 2)
  .eq('is_active', true)
  .order('display_name');

console.log('=== 중2 교과서 목록 ===');
for (const t of textbooks) {
  console.log(`  ${t.display_name} (${t.publisher || ''}) — ${t.id}`);
}
