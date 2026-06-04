/**
 * schema_migrations 테이블에 기존 마이그레이션 기록 동기화
 * supabase db push가 정상 작동하도록 함
 *
 * 실행: node scripts/sync-migrations.mjs
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

config({ path: '.env.local' });

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const migrationsDir = 'supabase/migrations';
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .filter(f => /^\d+_/.test(f))          // 숫자_이름.sql 패턴만
    .filter(f => !f.startsWith('015b_'))    // CLI가 스킵하는 파일 제외
    .sort();

  console.log(`마이그레이션 파일: ${files.length}개`);

  // version = 파일명에서 숫자 접두사 (001, 002, ..., 074)
  // name = 파일명에서 .sql 제거
  const values = files.map(f => {
    const name = f.replace('.sql', '');
    const version = name.split('_')[0]; // "001", "002", etc.
    return `('${version}', '{}', '${name}')`;
  });

  const sql = `INSERT INTO supabase_migrations.schema_migrations (version, statements, name) VALUES\n${values.join(',\n')}\nON CONFLICT (version) DO NOTHING;`;

  console.log('\n실행할 SQL:');
  console.log(sql.slice(0, 500) + '...\n');

  // Write to temp file for supabase db query
  fs.writeFileSync('/tmp/sync-migrations.sql', sql);
  console.log('SQL 파일 생성: /tmp/sync-migrations.sql');
  console.log('실행: npx supabase db query --linked < /tmp/sync-migrations.sql');
}

main().catch(console.error);
