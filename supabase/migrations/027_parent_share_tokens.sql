-- Parent share tokens for public report access
create table parent_share_tokens (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references users(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(18), 'hex'),
  created_by uuid not null references users(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Index for fast token lookup (only active tokens)
create index idx_parent_share_tokens_token on parent_share_tokens(token) where is_active = true;
create index idx_parent_share_tokens_student on parent_share_tokens(student_id) where is_active = true;

-- RLS: allow anon/public read by token, authenticated users manage
alter table parent_share_tokens enable row level security;

-- Service role can do everything (used by API routes)
create policy "service_role_full_access" on parent_share_tokens
  for all using (true) with check (true);

-- Public can read active tokens (for parent page token validation)
create policy "public_read_active_tokens" on parent_share_tokens
  for select using (is_active = true);
