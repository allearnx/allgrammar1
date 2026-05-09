import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const res = await fetch(`${url}/rest/v1/voca_vocabulary?or=(front_text.like.%25%20,front_text.like.%20%25,back_text.like.%25%20,back_text.like.%20%25)&select=id,front_text,back_text&limit=1000`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
const rows = await res.json();
console.log(`Found ${rows.length} rows with whitespace`);

let updated = 0;
for (const row of rows) {
  const trimFront = row.front_text.trim();
  const trimBack = row.back_text.trim();
  if (trimFront === row.front_text && trimBack === row.back_text) continue;

  const body = {};
  if (trimFront !== row.front_text) body.front_text = trimFront;
  if (trimBack !== row.back_text) body.back_text = trimBack;

  await fetch(`${url}/rest/v1/voca_vocabulary?id=eq.${row.id}`, {
    method: 'PATCH',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  updated++;
}
console.log(`Updated ${updated} rows`);
