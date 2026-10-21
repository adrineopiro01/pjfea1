-- Peace Journalism Foundation — Supabase schema.
-- Run once in Supabase → SQL Editor → New query. Safe to re-run.

-- ============ TABLES ============

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  role text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null default '',
  author_role text,
  author_bio text,
  author_photo text,
  category text not null default '',
  tag text not null default '',
  excerpt text not null default '',
  pullquote text,
  body text not null default '',
  photo text,
  gallery jsonb,
  featured boolean not null default false,
  date date not null default current_date,
  date_label text,
  read_time text,
  status text not null default 'draft' check (status in ('draft', 'pending', 'published')),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists articles_status_idx on public.articles (status);
create index if not exists articles_created_by_idx on public.articles (created_by);

-- One row (id = 'site') holding the admin-editable homepage values.
create table if not exists public.settings (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Written only by the /api donation functions (service role). Admins can read.
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  tx_ref text not null,
  fund text,
  fund_name text,
  amount numeric not null,
  currency text not null,
  frequency text,
  donor_name text,
  donor_email text,
  donor_phone text,
  status text not null default 'pending',
  flw_id text unique,
  paid_amount numeric,
  paid_currency text,
  payment_type text,
  renewal_of text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists donations_tx_ref_idx on public.donations (tx_ref);
create index if not exists donations_created_at_idx on public.donations (created_at desc);

-- Newsletter sign-ups. The public can add an email; only admins can read the list.
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists subscribers_email_key on public.subscribers (lower(email));

-- ============ HELPERS ============

-- security definer so policies can check roles without recursing into profiles' own policies.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists articles_touch on public.articles;
create trigger articles_touch before update on public.articles
  for each row execute function public.touch_updated_at();
drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ============ ROW LEVEL SECURITY ============

alter table public.profiles enable row level security;
alter table public.articles enable row level security;
alter table public.settings enable row level security;
alter table public.donations enable row level security;
alter table public.subscribers enable row level security;

-- profiles: everyone on staff reads their own; admins read all. Changes go through /api/admin-users.
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select
  using (id = auth.uid() or public.is_admin());

-- articles
drop policy if exists "articles read" on public.articles;
create policy "articles read" on public.articles for select
  using (status = 'published' or created_by = auth.uid() or public.is_admin());

drop policy if exists "articles insert" on public.articles;
create policy "articles insert" on public.articles for insert
  with check (public.is_staff() and created_by = auth.uid() and (status <> 'published' or public.is_admin()));

drop policy if exists "articles update" on public.articles;
create policy "articles update" on public.articles for update
  using (public.is_admin() or created_by = auth.uid())
  with check (public.is_admin() or (created_by = auth.uid() and status <> 'published'));

drop policy if exists "articles delete" on public.articles;
create policy "articles delete" on public.articles for delete
  using (public.is_admin() or (created_by = auth.uid() and status <> 'published'));

-- settings
drop policy if exists "settings read" on public.settings;
create policy "settings read" on public.settings for select using (true);
drop policy if exists "settings insert" on public.settings;
create policy "settings insert" on public.settings for insert with check (public.is_admin());
drop policy if exists "settings update" on public.settings;
create policy "settings update" on public.settings for update using (public.is_admin()) with check (public.is_admin());

-- donations: read-only for admins; no client writes at all
drop policy if exists "donations read" on public.donations;
create policy "donations read" on public.donations for select using (public.is_admin());

-- subscribers
drop policy if exists "subscribers insert" on public.subscribers;
create policy "subscribers insert" on public.subscribers for insert with check (true);
drop policy if exists "subscribers read" on public.subscribers;
create policy "subscribers read" on public.subscribers for select using (public.is_admin());

-- ============ REALTIME ============
-- Lets open pages refresh when articles or settings change (Realtime still applies the policies above).
do $$
begin
  begin alter publication supabase_realtime add table public.articles; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.settings; exception when duplicate_object then null; end;
end $$;
