-- 5 State Group -- Supabase schema
-- Run this once in your Supabase project's SQL Editor (Project > SQL Editor > New query).
-- Safe to re-run: uses "if not exists" / "or replace" where possible.
-- If you're re-running this after already setting up members/transactions/holdings,
-- only the new `projects` and `project_comments` tables (and their policies/realtime)
-- will actually be created -- everything else is a harmless no-op.

-- ---------------------------------------------------------------------------
-- Members
-- ---------------------------------------------------------------------------
create table if not exists members (
  id text primary key,
  name text not null,
  email text unique,
  date_joined date
);

insert into members (id, name, email, date_joined) values
  ('m1', 'Prasanth', null, current_date),
  ('m2', 'Balaji',   null, current_date),
  ('m3', 'Gokul',    null, current_date),
  ('m4', 'Ravi',     null, current_date),
  ('m5', 'Suresh',   null, current_date)
on conflict (id) do nothing;

-- After creating the 5 login accounts in Authentication > Users, come back
-- and set each member's real email here so the app can match "who's logged
-- in" to the right member row, e.g.:
--   update members set email = 'prasanth@example.com' where id = 'm1';

-- ---------------------------------------------------------------------------
-- Transactions -- the core table, every money movement is a row
-- ---------------------------------------------------------------------------
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  member_id text not null references members(id),
  to_member_id text references members(id), -- only set for type = 'Transfer'
  type text not null,
  category text not null,
  amount numeric not null,
  status text default 'Active',
  notes text default '',
  linked_asset text default '',
  -- set when this row was created via the "Everyone (split equally)" option,
  -- so rows that were fanned out together can be identified/labeled
  batch_id text,
  batch_total numeric,
  batch_count int,
  batch_split text, -- 'equal' or 'idle_cash_weighted'
  created_at timestamptz default now()
);

create index if not exists transactions_member_id_idx on transactions(member_id);
create index if not exists transactions_date_idx on transactions(date);
create index if not exists transactions_batch_id_idx on transactions(batch_id);

-- ---------------------------------------------------------------------------
-- Holdings -- manual current-value overrides per category/position
-- ---------------------------------------------------------------------------
create table if not exists holdings (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  description text not null,
  amount_invested numeric default 0,
  current_value numeric default 0,
  date_acquired date,
  status text default 'Active',
  -- Stock Market extras
  ticker text,
  quantity numeric,
  average_price numeric,
  live_price numeric,
  price_updated_at timestamptz
);

create index if not exists holdings_category_idx on holdings(category);

-- ---------------------------------------------------------------------------
-- Projects -- a simple standalone board, not linked to transactions/holdings.
-- Just a name plus a running comment thread per project, shown as cards.
-- ---------------------------------------------------------------------------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by text references members(id),
  created_at timestamptz default now()
);

create table if not exists project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  member_id text references members(id),
  comment text not null,
  created_at timestamptz default now()
);

create index if not exists project_comments_project_id_idx on project_comments(project_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- This is a private app for 5 trusted friends who all see and edit the same
-- shared data -- so the policy is simply "any signed-in user can do anything",
-- not per-row ownership. Anonymous (logged-out) access is blocked entirely.
-- ---------------------------------------------------------------------------
alter table members enable row level security;
alter table transactions enable row level security;
alter table holdings enable row level security;
alter table projects enable row level security;
alter table project_comments enable row level security;

drop policy if exists "members_all_authenticated" on members;
create policy "members_all_authenticated" on members
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "transactions_all_authenticated" on transactions;
create policy "transactions_all_authenticated" on transactions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "holdings_all_authenticated" on holdings;
create policy "holdings_all_authenticated" on holdings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "projects_all_authenticated" on projects;
create policy "projects_all_authenticated" on projects
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "project_comments_all_authenticated" on project_comments;
create policy "project_comments_all_authenticated" on project_comments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Realtime -- lets every member's browser see changes the moment anyone
-- else adds/edits/deletes a transaction, holding, project, or comment,
-- without refreshing.
-- ---------------------------------------------------------------------------
-- Newer Supabase projects sometimes auto-add new tables to this publication
-- already, which makes a plain "alter publication ... add table" error with
-- "already member of publication". The DO blocks below just skip a table
-- that's already in the publication instead of failing.
do $$
begin
  alter publication supabase_realtime add table transactions;
exception when duplicate_object then
  null;
end $$;

do $$
begin
  alter publication supabase_realtime add table holdings;
exception when duplicate_object then
  null;
end $$;

do $$
begin
  alter publication supabase_realtime add table members;
exception when duplicate_object then
  null;
end $$;

do $$
begin
  alter publication supabase_realtime add table projects;
exception when duplicate_object then
  null;
end $$;

do $$
begin
  alter publication supabase_realtime add table project_comments;
exception when duplicate_object then
  null;
end $$;
