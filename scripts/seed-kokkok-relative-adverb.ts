/**
 * 내신 콕콕 첫 세트 등록 (2026-09-17) — 마이그레이션 111 배포 후 1회 실행.
 *  1) 콘텐츠 관리 L27(관계대명사) 아래 문법 주제 "관계부사" 추가 (없으면)
 *  2) 관계부사=전치사+관계대명사 집중훈련 템플릿(b4642997)을 kind='kokkok', grammar_id=관계부사, 주제 '내신 콕콕'으로 전환
 *  npx tsx --env-file=.env.local scripts/seed-kokkok-relative-adverb.ts [--apply]
 */
import { createAdminClient } from '@/lib/supabase/admin';
const APPLY = process.argv.includes('--apply');
const LEVEL_27 = '16303f33-750c-4c2a-9470-b8246103e1b9';
const TEMPLATE = 'b4642997-340d-4fe1-9507-65601bef0793';
async function main() {
  const admin = createAdminClient();
  const { data: existing } = await admin.from('grammars').select('id, title').eq('level_id', LEVEL_27).eq('title', '관계부사').maybeSingle();
  let grammarId = existing?.id;
  console.log(grammarId ? `문법 주제 "관계부사" 이미 있음 ${grammarId}` : '문법 주제 "관계부사" 신규 생성 예정 (L27 관계대명사 아래, sort_order 1)');
  const { data: t } = await admin.from('naesin_templates').select('id, title, kind, grammar_id').eq('id', TEMPLATE).single();
  console.log('템플릿 현재:', JSON.stringify(t));
  if (!APPLY) { console.log('[dry-run]'); return; }
  if (!grammarId) {
    const { data: g, error } = await admin.from('grammars').insert({ level_id: LEVEL_27, title: '관계부사', description: '관계부사 where/when/why/how와 전치사+관계대명사', sort_order: 1 }).select('id').single();
    if (error) throw error; grammarId = g.id;
  }
  const { error } = await admin.from('naesin_templates').update({ kind: 'kokkok', grammar_id: grammarId, template_topic: '내신 콕콕', title: '관계부사=전치사+관계대명사' }).eq('id', TEMPLATE);
  if (error) throw error;
  console.log(`✓ 관계부사 주제 ${grammarId} / 템플릿 kokkok 전환`);
}
main().catch((e) => { console.error(e); process.exit(1); });
